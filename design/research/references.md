# Arc Guard — reference board

Research date: 2026-09-25. Every URL below was opened or returned by search on that date. Facts marked *(source)* come from the linked page. Everything else is our design call.

**The idea behind every pick:** a 1950s bank earned trust by *showing its machinery*: the vault door you could see from the street, the second key the clerk turned, the clock that would not open early, the passbook line in ink. Arc Guard has real machinery too: two keys, a 7-day timer, and on-chain receipts. The design job is to **show that machinery**, not to decorate the page with bank props.

---

## A. Film and TV

### 1. *Mary Poppins* (1964): "Fidelity Fiduciary Bank" and the tuppence bank run
- Source: https://en.wikipedia.org/wiki/Mary_Poppins_%28film%29 · scene: https://www.youtube.com/watch?v=XxyB29bDbBA
- What it is: old bankers sing to a small boy about investing his tuppence "safe and sound". When he shouts "give me back my money", other customers overhear and start a run on the bank *(source: Rutgers econ syllabus, https://economics.rutgers.edu/images/ROCKOFF_Rutgers_Playlist_for_American_Economic_History_8-26-2024.pdf)*.
- **Borrow:** the scale of a single coin. The savings fantasy is about *tuppence*, not a fortune. Our Savings coin jar should make 1.00 USDC feel worth keeping: a real coin drops for every deposit, even a tiny one. Use the typewriter "compound" figure (interest ticking up at the 6th decimal) as a quiet joke about patience rather than a boast.
- **Avoid:** the looming, towering bankers. The film's bank is the *villain*: dark, vertical, and intimidating to a child. Keep our ceilings low and our lamps warm. The customer should stand at the counter as an equal, not under a portrait of a stern founder.

### 2. *It's a Wonderful Life* (1946): the run on Bailey Building & Loan
- Source: https://en.wikipedia.org/wiki/It%27s_a_Wonderful_Life · context: https://www.stlouisfed.org/open-vault/2025/dec/how-its-wonderful-life-helps-explain-us-building-loan-associations
- What it is: George calms panicking members with "The money's not here. Your money's in Joe's house…" *(source: quoted at https://prosperitythinkers.com/fractional-reserve-banking)*. He is telling the truth about where the money is.
- **Borrow:** the honesty move. George wins trust by explaining *where the money actually is*, not by denying risk. That is exactly our Savings note: "Earns by lending through Morpho. Small extra risk." Put a "Where is my money?" line on the box screen with two plain answers. Locker: "In this contract, at 0x…". Savings: "Lent through the Galaxy USDC vault on Morpho". Both link to the explorer.
- **Avoid:** melodrama around withdrawals. Taking money out must never feel like a bank run: no warning red and no "Are you sure?" guilt on a normal withdrawal. Keep red only for the emergency exit tag.

### 3. *Harry Potter and the Philosopher's Stone* (2001): Gringotts, Vault 687 and Vault 713
- Source: https://en.wikipedia.org/wiki/Harry_Potter_and_the_Philosopher%27s_Stone_(film) · scene: https://www.youtube.com/watch?v=6YqH9teBVis · vault notes: https://www.hp-lexicon.org/place/great-britain-united-kingdom/england/london/diagon-alley/gringotts-wizarding-bank/gringotts-vaults/vault-713
- What it is: Harry needs his own small key *and* a goblin's escort to reach Vault 687. Vault 713 is "top security" *(source)*. It is the best-known modern screen image of "a customer key plus the bank's permission".
- **Borrow:** the numbered door as identity. "Vault 687" is memorable because it's a number, not a name. Derive the box number from the address as 3 to 4 digits (e.g. **Box № 4172**) and stamp it big on the drawer face in the typewriter face. Also borrow the reveal beat: the door opens, and there is a short pause (300–400 ms) of lamp light before the contents show.
- **Avoid:** the mine-cart roller coaster, the mountains of gold, and the fantasy creatures. They signal spectacle and hoarded wealth, the opposite of a modest savings box. No dungeon green-black, no torchlight flicker.

---

## B. Real places and real machinery

### 4. Manufacturers Trust Company Building, 510 Fifth Avenue, NYC (1954), the vault door you can see from the street
- Source: https://en.wikipedia.org/wiki/Manufacturers_Trust_Company_Building · NYC landmark report: http://s-media.nyc.gov/agencies/lpc/lp/2467.pdf
- What it is: the first International Style bank branch in the US *(source)*. It has a round Mosler door designed by **Henry Dreyfuss**, 7 ft across, 16 in thick and 30 tons, placed on the ground floor behind glass and **visible from Fifth Avenue**. The banking entrance had no sign, "because SOM architects felt that the vault's presence indicated the building's purpose" *(source)*. It drew 15,000 visitors on its first day, and deposits tripled within nine months *(source)*.
- **This is the #1 reference.** It shows that a 1950s bank sold safety by making the vault *visible and open*, not hidden.
- **Borrow:** the landing screen *is* the Dreyfuss door, seen head-on and centered, with a steel face, concentric machined rings, and a spoked handwheel. The page needs no logo-first hero: the door is the sign. Frame it on a calm, well-lit wall (warm ivory or deep green) with lots of space around it, like the glass-fronted lobby. The "Protected against quantum computers" plaque sits beside the door like a brass nameplate, not across it.
- **Avoid:** a dim, gloomy vault. 510 Fifth was a bright glass "lantern" (Lewis Mumford) *(source)*. Our glow should be warm lamp light on a lit room, not a black void with a spotlight.

### 5. Mosler Safe Company: round vault doors
- Source: https://en.wikipedia.org/wiki/Mosler_Safe_Company · National Archives: https://prologue.blogs.archives.gov/2020/06/29/the-mosler-model
- What it is: the maker of the door above and of the vault that held the US Constitution, Declaration and Bill of Rights *(source)*.
- **Borrow:** the anatomy, for our SVG door: a stepped round door plug with a thick edge that shows its depth when it swings, a ring of locking bolts that retract *before* the door moves, a central handwheel with 3–5 spokes, and big hinge knuckles on one side. The motion order matters and reads as real. The handwheel turns about 90° over about 600 ms, the bolts retract with a stagger of about 40 ms between bolts, there is a beat of about 150 ms, and then the door swings on a heavy ease-out (`cubic-bezier(0.2, 0, 0, 1)`, about 1400 ms). Do the full sequence once per session and skip it on return visits.
- **Avoid:** cartoon combination dials with numbers spinning wildly. The "safe-cracker" dial is heist language (see anti-pattern 2).

### 6. Safe deposit box locks: renter key plus guard key
- Source: https://www.bullseyesdlocks.com/safe-deposit-locks/b500-product-group/ · overview: https://www.nytimes.com/2018/08/17/your-money/banking-safe-deposit-boxes.html
- What it is: safe deposit locks "require the rotation of a Customer or Renter Key in conjunction with the rotation of a second Bank or Guard key" *(Bullseye source)*. The two-key idea is literal industry hardware, not a metaphor we invented.
- **Borrow:** **two keyholes side by side on the drawer face**, labelled on engraved brass plates **KEY 1 · YOUR WALLET** and **KEY 2 · YOUR KEY CARD**. Each turns separately. After a key turns, its keyhole stays in the turned position and its plate gets a small check stamp. The drawer only slides out when both are turned. On the real hardware one key is the *bank's*. We must say clearly that **both keys are the customer's** (that is the point of the product), so key 2 is not labelled "Bank key".
- **Avoid:** implying Arc Guard holds a key. Copy must never say "we" turn anything. The contract checks the keys, and nobody at Arc Guard can open the box.

### 7. The bank time lock (James Sargent, 1873)
- Sources: https://en.wikipedia.org/wiki/Time_lock · https://en.wikipedia.org/wiki/James_Sargent · https://safeguardsafes.com.au/blogs/lock/the-origins-of-the-sg-time-lock
- What it is: a clockwork timer that keeps a vault shut until a set time, even to someone who knows the combination. Sargent built the first one on a bank vault in 1873 from lock parts and two kitchen clocks *(source)*.
- **Borrow:** this *is* our 7-day emergency exit, and it's a real, historic, trust-building mechanism. Show the pending exit as a **time lock movement**: a brass plate with a mechanical countdown in days, hours and minutes, typewriter numerals, and one gear that visibly steps each minute (not a smooth spin). Label: "Time lock set. Opens 2 Oct, 14:05, unless you cancel with your key card." Pair it with the red tag on the box.
- **Avoid:** a flashing digital countdown or seconds ticking in red. That is a sale timer (anti-pattern 1). The time lock should feel calm and certain.

### 8. Passbooks and deposit books: US Postal Savings System (1911–1967) and the UK Post Office Savings Bank (from 1861)
- Sources: https://postalmuseum.si.edu/the-20th-century-postal-savings-system · https://about.usps.com/who/profile/history/pdf/postal-savings-system.pdf · https://www.postoffice.alectritton.co.uk/page/victorian-posb/ · 1869 deposit book: http://www.postoffice.alectritton.co.uk/page/savingsbank-depositbook
- What it is: US postal savings aimed "to get money out of hiding, attract the savings of immigrants, provide safe depositories" *(Smithsonian)*. The UK POSB began 16 Sep 1861 "to encourage thrift, especially among the poorer classes" *(BPMA)*. Both ran on stamped, hand-entered deposit books, which is exactly the global, working-class, "I am really saving" artefact Jay wants.
- **Borrow:** the passbook layout. Use ruled ledger columns (**Date · Particulars · Withdrawals · Deposits · Balance**), a thin red double rule under the header, faint blue horizontal rules, and a printed account number at the top. Each event is one typed line: date in `DD MMM YY`, amounts right-aligned to 2 decimals, and a rubber stamp overlapping the right edge of the line at a random angle of −6° to +4°, with ink opacity 0.85 and a slightly uneven edge (SVG turbulence mask). Each line links to its Arc tx. The balance column is the emotional payoff: always show the running total.
- **Avoid:** fake handwriting fonts and coffee stains. Real passbooks were *machine-typed* and crisp. Keep aging to paper tone and a faint edge vignette, not grunge.

---

## C. Digital products that felt trustworthy because they felt made

### 9. Apple iOS 6 **Passbook** (2012), including the shredder
- Sources: https://www.macstories.net/stories/ios-6-our-complete-overview/ · shredder: https://www.ign.com/articles/2012/11/06/jony-ives-ios-revisions-likely-to-ditch-skeuomorphism
- What it is: Apple's first wallet app. It was literally called *Passbook*, and deleting a pass fed it through "the faux paper-shredder" *(IGN)*.
- **Borrow:** a *destructive or irreversible action gets a physical, one-time animation.* Ours is the key card reveal: the card is shown once, then a paper slip slides into a "printed" state with a **SHOWN ONCE** stamp. For withdrawals, the drawer slides out and the passbook line types itself.
- **Avoid:** the leather-and-stitching excess of iOS 6 elsewhere (Game Center felt, linen). Stitching and leather textures age badly and read as costume. Apply texture to *one* material per surface (steel door, paper passbook, brass plates) and never stack textures.

### 10. Teenage Engineering OP-1 field
- Source: https://teenage.engineering/products/op-1 · layout guide: https://teenage.engineering/guides/op-1/original/layout
- What it is: a machined aluminium instrument with **colour-coded encoders** that map one-to-one to on-screen colours *(layout guide)*, and a printed manual included *(product page)*.
- **Borrow:** colour as a functional code, not decoration. Give the two compartments one colour each and use it everywhere they appear: Locker = brass `#B08D57`, Savings = deep bank green (from the ColorMaterial peer's palette). The Deposit/Move sheet uses the same two colours for its two choices, so the choice reads before the label. Also borrow the printed-manual feeling: the key card as a real printable page with a folding line and instructions.
- **Avoid:** TE's playful Swiss minimalism (tiny grey labels, cryptic icons). Our audience is ordinary savers, so labels must be plain words at ≥14 px.

### 11. Panic **Playdate** (2019–): the crank
- Sources: https://pd.panic.com/ · https://blog.panic.com/playdate · https://www.theverge.com/circuitbreaker/2019/5/22/18628360/playdate-panic-teenage-engineering-qwop-katamari
- What it is: a tiny yellow handheld with a hand crank and a 1-bit screen, made with Teenage Engineering *(Verge)*.
- **Borrow:** one physical gesture that *means* something. Our equivalent is **turning the key**: on desktop, press and hold the keyhole, or drag in an arc of 0→90°. On phones, press and hold for 700 ms with a radial fill. The PQ signing progress (1 s desktop, 3–8 s phone) shows as the key slowly turning in the lock. That turns an unavoidable wait into the ceremony instead of a spinner.
- **Avoid:** making the gesture mandatory or finicky. Always offer a plain "Turn key" button as the keyboard/screen-reader path, with the same result.

### 12. Cultured Code **Things 3**
- Source: https://culturedcode.com/things/ (two Apple Design Awards *(source)*)
- What it is: the benchmark for calm, confident, low-chrome productivity UI with careful, small motion.
- **Borrow:** restraint in the *frequent* screens. The box screen (balances, three buttons) should be quiet, and heavy props live at the edges and in the one-off ceremonies. Use generous line-height (1.5 body), one primary button per view, and a completion moment that is small and satisfying (the passbook stamp: scale 1.15→1.0 over 180 ms, plus the thud).
- **Avoid:** copying its neutral, generic Apple look. Things is trustworthy because it's *precise*, not because it's grey. Keep our warmth.

### 13. Stripe Press website (2021 3D redesign)
- Sources: https://press.stripe.com/ · designer notes: https://yuinchien.com/p/stripe-press
- What it is: the book catalogue as 3D objects. It translates "the tactile qualities of print into a digital space… highlighting the unique craftsmanship of their spines and covers" *(Yuin Chien)*.
- **Borrow:** treating paper objects as objects. The passbook and key card get real thickness (a 2–4 px darker edge, a cover that opens on `rotateY` from 0 to −165° over 700 ms, and a soft contact shadow) and serious editorial typography. Stripe Press shows fintech people will read a serif. Reviewers from Circle already know this site's register.
- **Avoid:** WebGL. It's heavy on phones and overkill for us. CSS 3D transforms plus SVG are enough, and they degrade cleanly under reduced motion.

### 14. **Family** wallet (iOS, 2024) and Benji Taylor's "Family Values"
- Sources: https://benji.org/family-values · https://family.co/blog/launch · web recreation: https://emilkowal.ski/ui/family-tray-system
- What it is: a self-custody crypto wallet widely praised for making complex flows "feel welcoming" *(source)*. Its principles are simplicity, fluidity and delight. It uses trays of **different heights** so each step visibly changes, one action per tray, and a button label that morphs "Continue" into "Confirm" before a transaction *(source)*.
- **Borrow:** this is the proof that crypto can feel safe through craft. Use one step per sheet in Deposit and Withdraw, with each sheet a different height. Morph the primary label through the steps: **Approve → Deposit** and **Turn key 1 → Turn key 2 → Open drawer**. Also "avoid redundant animations": the drawer, jar and passbook persist between screens and never re-enter.
- **Avoid:** Family's bright, bubbly, rounded iOS aesthetic. Borrow the *structure*, not the look.

### 15. Monzo **Pots**
- Sources: https://monzo.com/features/pots · https://monzo.com/help/budgeting-overdrafts-savings/what-is-a-pot · pot types: https://monzo.com/help/investments/pot-type-explanation
- What it is: separate compartments inside one account. A Regular Pot just holds money, and a Savings Pot "earn[s] interest on it" *(source)*. That is our Locker/Savings split, already familiar to mainstream UK bank users.
- **Borrow:** the clear distinction between "holds" and "earns", shown the same way every time, and moving money between compartments as a cheap, reversible, same-screen action (our `moveToSavings`/`moveToLocker` need only the wallet). Keep "Move" as light as Monzo keeps it, and save the heavy two-key ceremony for money *leaving the box*.
- **Avoid:** Monzo's hot coral and card-centric modern-bank look. Also avoid pot-style customisation (emoji, images). One box, two compartments.

---

## D. Web motion craft

### 16. Emil Kowalski, "Great Animations" (plus Sonner/Vaul)
- Source: https://emilkowal.ski/ui/great-animations
- What it says *(source)*: prefer `ease-out`, and usually keep motion under 300 ms. Animate only `transform` and `opacity`. Make animations interruptible (CSS transitions over keyframes). Honour `prefers-reduced-motion` by swapping movement for opacity. Consider how *often* a user sees an animation, and never animate keyboard-initiated actions. The Sonner toast is deliberately "a bit slower… `ease`… to make it feel more elegant" to match its vibe.
- **Borrow:** this settles the tension between "weighty and slow" and "not annoying". **Slow is reserved for ceremonies seen once or rarely** (door open ~1.4 s, drawer slide 600–800 ms, key turn = real signing time). **Everything frequent stays under 250 ms ease-out** (buttons, sheets, balance updates). With reduced motion: the door appears already open, keys show turned states without rotation, and stamps fade in over 150 ms with no scale. Sounds still play (they're not motion), and a mute toggle sits in the corner.
- **Avoid:** springs with overshoot. The spec says "never bouncy", so use no spring with damping ratio below 1. Steel doesn't wobble.

---

## E. Three anti-patterns (explicitly banned)

### Anti-pattern 1: casino / crypto-bro gold
- What it looks like: gold-foil gradients on everything, coin showers, confetti on deposit, neon glow, big green APY numbers, "🚀", countdown timers in red, "Earn up to…". Fake urgency is a named deceptive pattern: https://www.deceptive.design/types/fake-urgency
- Why it's poison for us: the real APY is **~0.06%**. Hyping it would be dishonest and would read to Circle reviewers as a yield farm. Gold-as-wealth also says "gamble", which is the opposite of "saving".
- Rules: brass is a **material** (plates, hinges, key bows) at small scale, never a background or gradient fill. Show the APY once, plainly ("0.06% a year, live from the vault"), in body size, never as a hero number. No celebratory effects on deposit: the reward is a stamp and a coin clink. The emergency countdown uses the calm time-lock treatment (ref 7), never a sale timer.

### Anti-pattern 2: heist-comedy tone
- Reference to *not* copy: *Ocean's Eleven* (2001), "a 2001 American heist comedy" *(source: https://en.wikipedia.org/wiki/Ocean%27s_Eleven)*: slick crews, safe-cracking, laser grids, wink-wink "let's rob the vault".
- Why it's poison: the vault-door motif pulls toward this by default (dial spinning, "crack the code", stethoscope-on-safe, masked robber icons for "thief"). It makes theft playful and makes the user a *target*. It also clashes with post-quantum security, which is sober.
- Rules: no combination-dial spinning, no burglar or mask illustrations, no "can you crack it?" copy, no laser/scanner effects. When copy talks about threats, use plain nouns ("someone who steals your wallet key", "a future quantum computer"), not villains.

### Anti-pattern 3: fake security theatre
- Reference: Bruce Schneier, "Beyond Security Theater": https://www.schneier.com/essays/archives/2009/11/beyond_security_thea.html ("security measures that look good on television" vs ones that work) · TED, "The security mirage": https://www.ted.com/talks/bruce_schneier_the_security_mirage
- What it looks like: padlock icons on every card, shield badges, "bank-grade / military-grade encryption", fake "scanning…" progress bars, fake biometric prompts, fake "verified by" seals, "unhackable".
- Why it's poison: our whole pitch is that the *security is real* (a real SLH-DSA signature verified on-chain by Arc). Theatre makes the real thing look fake, and Circle reviewers will spot it instantly. It also breaks the spec's honesty rules (never "unhackable", never "approved by Circle").
- Rules: **every security visual must correspond to a real, checkable event.** The key-turn animation runs *exactly* as long as the real worker signing takes (driven by worker progress, never a fixed timer). The "✓ Arc verified the key card" stamp appears only after the `PQVerified` event is read, and links to it. The only shield/plaque is the one landing plaque, and its claim is scoped ("Protected against quantum computers", with a "What this means" link to the promises/non-promises). There are no decorative padlocks.

---

## F. Reference → screen map

| Screen | Primary references |
|---|---|
| 1. Vault door landing | 4 (visible door as sign), 5 (door anatomy/motion order), 16 (once-per-session ceremony) |
| 2. Open a box / key card | 3 (box number), 9 (shown-once physical moment), 10 (printed manual feel), 13 (paper object) |
| 3. Your box | 2 ("Where is my money?"), 15 (holds vs earns), 12 (calm frequent screen), 1 (coin jar scale) |
| 4. Deposit / Move | 14 (one step per sheet, label morph), 15 (move = light) |
| 5. Withdraw (two keys) | 6 (two keyholes on the drawer), 11 (key turn = signing progress), anti-pattern 3 (real events only) |
| 6. Passbook | 8 (ledger columns, stamps), 13 (book object), 9 |
| 7. Emergency exit | 7 (time lock), anti-pattern 1 (no sale timer) |
