# Security decisions

Why the security-relevant parts of this shop are built the way they are.
Written down because these choices are invisible from the UI, easy to undo by
accident, and the reasoning is the part that gets lost.

Applies to the code as it stands. Anything not yet built is listed under
[Known gaps](#known-gaps) rather than quietly omitted.

---

## Passwords

**scrypt, from Node's standard library** (`src/lib/password.ts`).

- scrypt is deliberately memory-hard, which is what makes it expensive to
  attack with GPUs.
- argon2id would be marginally stronger. It was not chosen because every
  option needs native compilation, and install-script friction in this
  environment is a real, recurring cost for a marginal gain.
- **No dependency at all.** One fewer package in the supply chain of the thing
  that guards customer accounts.

**Parameters:** `N=16384, r=8, p=1`, 64-byte key, 16-byte salt.

**Salting:** a fresh random salt per password. Two users with the same password
get different hashes, so one cracked hash tells an attacker nothing about
anyone else, and precomputed tables are useless.

**Stored format:** `scrypt$N$r$p$<salt>$<hash>`

The parameters travel with the hash. Raising the cost later is therefore a
re-hash on next sign-in, not a migration — old hashes stay verifiable because
they carry the settings they were made with.

**Comparison is constant time** (`timingSafeEqual`). A fast "wrong" answer
leaks how much of the hash matched, which is enough to reconstruct it a byte at
a time.

**Normalisation:** passwords are `NFKC`-normalised before hashing, so a
password typed with a differently-composed accent still matches.

**Minimum length is 10 characters, with no composition rules.** Length beats
punctuation; forcing symbols mostly produces `Password1!` and a sticky note.

---

## Account enumeration

A sign-in form must not reveal which email addresses have accounts.

**Same message:** wrong password and unknown email both return
*"Email or password is incorrect."*

**Same timing:** when no account exists, `fakeVerify()` runs a throwaway scrypt
hash. Without it, "no such user" returns in ~0ms while "wrong password" takes
~30ms, and that difference is a reliable oracle. Measured at 28ms vs 29ms.

**Password reset says the same thing either way:** *"If that email has an
account, a reset link is on its way."* — whether or not it does.

**Registration is the deliberate exception.** It has to say the address is
already taken, or people cannot understand why signup failed. This is the
standard trade-off: the reset form is the sensitive one because it can be
automated silently, while registration is noisy and rate-limitable.

---

## Sessions

**Server-side sessions, not JWTs** (`src/lib/auth.ts`).

- The cookie holds an opaque 32-byte random token and nothing else.
- Signing out **deletes the row**, so it takes effect immediately. A stateless
  JWT stays valid until it expires, which is the wrong behaviour when someone
  signs out on a shared device.

**Only a hash of the token is stored.** A leaked database therefore cannot be
replayed as a session. The raw value exists solely in the customer's cookie.

**Cookie flags:** `httpOnly` (JavaScript cannot read it, so an XSS bug cannot
steal it), `sameSite=lax` (blocks cross-site request forgery on state-changing
requests while normal navigation still works), `secure` in production, 30-day
expiry.

**Expiry is enforced server-side** on every read, not trusted from the cookie.

---

## Brute force

Two limits, because they stop different attacks. The per-account lockout stops
many guesses against **one** account; the per-address limit stops one password
being sprayed across **many** accounts, where each account would only ever see
a single failure.

### Per account

**5 failed attempts locks an account for 15 minutes.**

The counter lives in the database, not memory, so a restart does not clear it
and it holds across multiple processes.

A successful sign-in resets the counter. A password reset clears the lock —
otherwise an attacker could lock someone out of their own account indefinitely
by guessing wrong on purpose.

**During a lock, even the correct password is refused.** Otherwise the lock
tells an attacker when they have guessed right.

### Per address

Fixed-window counters in the database (`src/lib/rate-limit.ts`), so a restart
cannot clear an attacker's budget:

| What | Limit | Window |
|---|---|---|
| Failed sign-ins | 25 | 15 min |
| Accounts created | 5 | 1 hour |
| Reset requests, per address | 5 | 1 hour |
| Reset requests, per email | 3 | 1 hour |
| Verification re-sends, per account | 3 | 1 hour |

**Failures against addresses that don't exist still count**, or an attacker
could probe for free using made-up emails.

**A successful sign-in clears the address's budget**, so a household sharing an
address is not punished for one person's typos.

**Reset requests are limited per recipient as well as per sender**, so nobody
can be mail-bombed by an attacker who knows their address.

**Throttled reset requests return the same message as successful ones.** A
different response when throttled would itself reveal which addresses are
registered.

The sign-in limit is generous on purpose: households, offices and mobile
carriers share addresses, and locking out a whole building to slow one attacker
is a bad trade. 25 failures in 15 minutes is far below what a spraying attack
needs and far above what a real person produces.

**Limitation.** Client addresses come from forwarded headers, which are
authoritative behind Cloudflare but forgeable by anyone reaching the origin
directly. The fix is a firewall limiting 443 to Cloudflare's ranges — until
then this is defence in depth, not the only defence.

---

## Tokens (password reset, email verification)

- 32 bytes from `randomBytes`, base64url encoded.
- **Stored hashed**, like session tokens. A leaked database cannot be used to
  reset anyone's password.
- **Single use** — consumed on success, marked with `usedAt`.
- **Short-lived**: password reset 1 hour, email verification 48 hours.
- **One live token per purpose per user**: issuing a new one deletes the old,
  so an old link in an inbox stops working.
- Invalid, expired and already-used tokens all return the same message, so the
  page cannot be used to probe which tokens exist.

**A password reset destroys every existing session.** If the reset was prompted
by a compromise, leaving the attacker signed in defeats the point.

---

## Redirects

`?next=` is only honoured when it starts with a single `/`. Without that check,
`?next=https://evil.example` turns our sign-in page into a credible phishing
hop.

---

## Route protection

Guards are `requireUser()` / `requireAdmin()` **inside pages**, not in
`proxy.ts`.

The proxy runs on every request including static assets; a session lookup there
would mean a database read per asset. Pages that need a user ask for one.

`requireAdmin()` redirects non-admins to `/account` rather than showing a
"forbidden" page, so an admin URL does not confirm it exists.

---

## Cart integrity

The cart is **server-authoritative**. The client sends an id and a desired
quantity; the server decides what happens against live stock and clamps.
Prices are never accepted from the client. Cart item lookups are scoped by the
cookie's cart token, so one cart cannot edit another's rows.

Personalisation is validated server-side against the product's field
definitions — verified by stripping `maxlength` in the browser and sending 20
characters into a 3-character field, which the server rejected.

---

## Email

Sent through **Resend** as `noreply@mabrowns.ca`. Inbound `admin@mabrowns.ca`
is forwarded to Gmail by Cloudflare Email Routing.

The two do not collide because Resend's MX and SPF sit on `send.mabrowns.ca`
while Email Routing owns the root MX and root SPF. SPF is checked against the
return-path (`send.`), DKIM is signed on the root, so DMARC aligns and the
visible From address is still on the apex.

| Record | Where | Purpose |
|---|---|---|
| MX `route1-3.mx.cloudflare.net` | root | inbound to Gmail |
| `v=spf1 include:_spf.mx.cloudflare.net ~all` | root | Email Routing |
| MX `feedback-smtp…amazonses.com` | `send` | Resend bounces |
| `v=spf1 include:amazonses.com ~all` | `send` | Resend return-path |
| `resend._domainkey` | root | DKIM |
| `v=DMARC1; p=none; rua=…` | `_dmarc` | monitoring |

DMARC is at `p=none` deliberately — monitor first. Tighten to `quarantine`
then `reject` once the reports show only legitimate sources.

The API key is scoped to **sending only**; it cannot read or manage domains.

A provider failure is logged, never surfaced. The reset form returns the same
answer whether or not an account exists, and "we couldn't send that" would
undo it.

## Transport

Cloudflare in front, **SSL/TLS mode Full (strict)**, with a Cloudflare Origin
CA certificate on the origin so the hop from Cloudflare to the box is
encrypted and verified. Caddy terminates TLS; Next binds to loopback only.

---

## The pre-launch gate is not access control

`SITE_LOCKED` shows a coming-soon page to everyone except allowed IPs or a
preview cookie. It trusts forwarded IP headers, which anyone reaching the
origin directly can spoof. It is a "not open yet" sign. Nothing that must stay
private should rely on it.

---

## Known gaps

Real, and deliberately not hidden:

- **Email verification is not enforced** — see below.
- **Rate limiting trusts forwarded IP headers**, which can be forged by
  reaching the origin directly rather than through Cloudflare. Firewalling 443
  to Cloudflare's ranges closes this.
- **No CSRF tokens.** Next's Server Actions are same-origin POSTs and the
  session cookie is `sameSite=lax`, which covers the common cases, but this is
  worth revisiting before checkout handles money.
- **No audit log.** Nothing records sign-ins, password changes or admin
  actions.
- **No 2FA.**
- **Dev server in production.** Currently `next dev` behind Caddy; must become
  a production build before launch.

---

## Email verification

Sent on registration, and **deliberately never blocking**.

| Question | Answer |
|---|---|
| Is the account created immediately? | Yes, and signed in |
| Is a verification email sent? | Yes, link valid 48 hours, single use |
| Can an unverified account browse and add to cart? | Yes |
| Can an unverified account buy? | **Yes** |
| Are unverified accounts deleted? | **Never** |
| What does an unverified user see? | A banner on `/account` with a resend button |

**Why buying is not blocked.** Phase 4 includes guest checkout, so someone with
no account at all can buy. Turning away a registered-but-unverified customer
while waving strangers through would be incoherent, and it silently costs sales
every time a message lands in spam. The order confirmation email verifies the
address in practice — if it does not arrive, the customer tells you.

**Why unverified accounts are never deleted.** A timer cannot distinguish a
junk signup from a real customer whose provider was slow, who was away, or
whose mail was filtered. Deleting an account that has an order attached is
worse still. Junk signups cost a database row; deleting a real customer costs a
customer.

**What verification will gate**, once there is something worth gating: changing
the account's email address. Not buying, not order history.
