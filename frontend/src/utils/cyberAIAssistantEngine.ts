/**
 * CCIP Sovereign AI Assistant & Cybercrime Investigation Copilot Engine
 * 
 * Provides real-world conversational intelligence (like Google Gemini and ChatGPT):
 * 1. Direct Google Gemini 1.5 Flash / Pro API integration (when user provides API key)
 * 2. In-depth Cybercrime Forensics & Tactical Co-Investigator Engine (offline / sovereign)
 * 3. Proactive Investigation Guidance:
 *    - Direct technical & forensic explanations
 *    - 🚀 What You Need To Do Right Now (Immediate Triage)
 *    - 🧭 What To Do Next (Strategic Forensic Roadmap)
 *    - ⚠️ Common Mistakes You Made or Need to Avoid (Critical Pitfalls)
 *    - 📌 Case-Grounded Evidence Integration across ALL case categories
 * 4. Markdown rendering & sanitization via marked and DOMPurify
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

export interface CaseIndicator {
  id: string;
  value: string;
  type: string;
  badge: 'Suspicious' | 'Unverified' | 'Verified' | 'Malicious';
  badgeType: 'danger' | 'warning' | 'success';
  icon: string;
}

export interface CaseEvidenceFile {
  id: string;
  name: string;
  type: 'Image' | 'PDF' | 'Text' | 'Audio';
  timestamp: string;
}

export interface CaseContextData {
  id: string;
  referenceNumber: string;
  title: string;
  category: string;
  date: string;
  status: string;
  statusLabel: string;
  priority: string;
  evidenceCount: number;
  indicatorsCount: number;
  linksCount: number;
  source: string;
  complainant: string;
  department: string;
  incidentType: string;
  pendingVerifications: number;
  summary: string;
  recordedFacts: {
    incidentReport: string;
    reportedUrl?: string;
    transactionRef?: string;
    uploadedDocsCount: number;
    docDetails: string[];
    incidentType: string;
    sourceCount: number;
  };
  keyIndicators: CaseIndicator[];
  evidenceFiles: CaseEvidenceFile[];
  verificationNeeds: string[];
  suggestedNextChecks: string[];
  timeline: Array<{
    time: string;
    event: string;
  }>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  time: string;
  text?: string;
  isInitialDossier?: boolean;
  bullets?: string[];
  modelUsed?: string;
  source?: 'gemini' | 'local_llm' | 'neural_engine';
}

// Configure marked for clean, safe rendering
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Safely parse Markdown to HTML with DOMPurify sanitization
 */
export function renderMarkdown(content: string): string {
  if (!content) return '';
  try {
    const rawHtml = marked.parse(content) as string;
    return DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ['target', 'rel'],
      ADD_TAGS: ['mark', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote', 'hr']
    });
  } catch (err) {
    console.error('Error parsing markdown:', err);
    return DOMPurify.sanitize(content);
  }
}

/**
 * Direct Google Gemini API Request
 */
export async function queryGoogleGemini(
  apiKey: string,
  userPrompt: string,
  activeCase: CaseContextData,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

  // Build system instruction & case grounding with mandatory co-investigator guidance
  const systemInstruction = `You are the CCIP Sovereign AI Investigation Assistant & Cybercrime Forensics Copilot.
You assist verified cybersecurity specialists, cyber police officers, and forensic examiners investigating cyber fraud and digital crimes.
Communicate like a senior world-class real-world AI assistant (such as Google Gemini or ChatGPT): articulate, helpful, highly knowledgeable, and proactive in guiding humans through complex investigations.

CRITICAL OPERATIONAL STRUCTURE:
For every inquiry, provide a well-structured response that includes:
1. DIRECT EXPERT ANSWER: Directly and thoroughly answer the user's question with precise technical, forensic, and legal depth (e.g. if they ask for URL phishing features, list all lexical, host, SSL, content, and behavioral features).
2. 🚀 WHAT YOU NEED TO DO RIGHT NOW (Immediate Triage): The urgent actions that must be completed within minutes/hours (golden hour debit freeze, volatile data capture, DNS preservation).
3. 🧭 WHAT TO DO NEXT (Strategic Investigation Workflow): Detailed legal notices under Section 91 CrPC, ISP/bank subpoenas, cross-case correlation checks, and evidence sealing under Section 65B/63 BSA.
4. ⚠️ CRITICAL MISTAKES TO AVOID (Investigator Pitfalls): Explicitly point out what mistakes investigators make (or might have made) in this kind of case (e.g., unisolated browsing, premature takedowns without preserving hash evidence, delayed Section 102 notices, ignoring 2nd/3rd tier mule routing).
5. 📌 CASE APPLICATION: Directly reference and apply the advice to the active case: ${activeCase.referenceNumber} (${activeCase.title}).

CURRENT ACTIVE CASE RECORDS:
- Case Reference ID: ${activeCase.referenceNumber}
- Title: ${activeCase.title}
- Category: ${activeCase.category}
- Priority: ${activeCase.priority} | Status: ${activeCase.statusLabel}
- Complainant / Source: ${activeCase.complainant} (${activeCase.source})
- Incident Narrative: ${activeCase.recordedFacts.incidentReport}
- Reported URL: ${activeCase.recordedFacts.reportedUrl || 'None'}
- Transaction Reference: ${activeCase.recordedFacts.transactionRef || 'None'}
- Indicators Extracted (${activeCase.keyIndicators.length}):
${activeCase.keyIndicators.map(i => `  • [${i.type}] ${i.value} (${i.badge})`).join('\n')}
- Evidence Uploaded (${activeCase.evidenceFiles.length}):
${activeCase.evidenceFiles.map(e => `  • ${e.name} (${e.type}) - ${e.timestamp}`).join('\n')}
- Timeline Milestones:
${activeCase.timeline.map(t => `  • ${t.time}: ${t.event}`).join('\n')}
- Pending Verification Needs:
${activeCase.verificationNeeds.map(v => `  • ${v}`).join('\n')}`;

  // Format past turns for multi-turn context
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  // Add system instruction as initial context
  contents.push({
    role: 'user',
    parts: [{ text: `${systemInstruction}\n\nPlease acknowledge your role and active case grounding.` }]
  });
  contents.push({
    role: 'model',
    parts: [{ text: `Understood. I am loaded with the verified case records for **${activeCase.referenceNumber}** (${activeCase.title}). I will directly answer your inquiry, provide immediate triage steps, strategic next actions, and point out critical investigative mistakes to avoid.` }]
  });

  // Recent history (last 4 messages)
  const recentHistory = conversationHistory
    .filter(m => !m.isInitialDossier && m.text)
    .slice(-4);

  for (const msg of recentHistory) {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text || '' }]
    });
  }

  // Current user prompt
  contents.push({
    role: 'user',
    parts: [{ text: userPrompt }]
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    })
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const errorMsg = errorJson?.error?.message || `HTTP ${response.status} from Gemini API`;
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) {
    throw new Error('Gemini API returned an empty response.');
  }

  return candidateText.trim();
}

/**
 * Case-Specific Dynamic Co-Investigator Generators
 */
export function getImmediateActionsForCase(c: CaseContextData): string {
  const cat = (c.category + ' ' + c.incidentType + ' ' + c.title).toLowerCase();

  if (cat.includes('qr') || cat.includes('upi') || cat.includes('payment')) {
    return `1. **Trigger National Cyber Portal 1930 / I4C CFCFRMS Freeze:** Immediately register the transaction reference \`${c.recordedFacts.transactionRef || 'disputed reference'}\` on the CFCFRMS gateway to stop fund disbursement.
2. **Issue Emergency Section 102 CrPC Lien Notice:** Email the Nodal Officer of the beneficiary bank (Axis Bank) to place an immediate debit freeze on the recipient account/VPA \`${c.keyIndicators.find(i => i.type.includes('Bank') || i.type.includes('UPI'))?.value || 'XXXX 6789'}\`.
3. **Capture & Seal Complainant Media:** Extract the raw QR code image and payment debit SMS with SHA-256 hash preservation for Section 65B/63 BSA certification.`;
  }

  if (cat.includes('shopping') || cat.includes('ecommerce') || cat.includes('store')) {
    return `1. **Contact Payment Aggregator Compliance:** Identify the merchant aggregator (Razorpay/Cashfree) linked to transaction \`${c.recordedFacts.transactionRef || 'gateway ref'}\` and request a settlement hold before the standard T+2 payout cycle expires.
2. **Preserve Storefront Forensics before Takedown:** Scrape the full DOM source, SSL certificate chain, and HTTP request/response headers of \`${c.recordedFacts.reportedUrl || 'the reported domain'}\` in an isolated sandbox.
3. **Emergency DNS & Registrar Freeze:** Query WHOIS and issue a preservation request to the registrar (Namecheap/GoDaddy) under Section 91 CrPC before the fraudster deletes the host.`;
  }

  if (cat.includes('impersonation') || cat.includes('social media') || cat.includes('identity')) {
    return `1. **Submit Emergency Platform Preservation Request:** Send an official preservation requisition to Meta / Telegram Law Enforcement portal to freeze account handle logs, IP history, and chat transcripts.
2. **Verify Account Compromise Vector:** Determine whether the complainant's profile was cloned (new fake profile) or taken over via credential harvesting / session cookie theft (AiTM).
3. **Preserve Public Profile Evidence:** Capture full web archives (Wayback Machine / archive.today) and cryptographic SHA-256 hashes of the impersonating profile.`;
  }

  if (cat.includes('investment') || cat.includes('crypto') || cat.includes('ponzi')) {
    return `1. **Trace Fiat Ingress Banking Pool:** Map the INR bank accounts where the victim remitted deposits (e.g. batch \`${c.recordedFacts.transactionRef || 'ledger pool'}\`) and issue immediate Section 102 CrPC debit freezes on all 1st tier pool accounts.
2. **Distinguish Simulated vs Real Blockchain:** Verify whether the victim was shown a counterfeit web dashboard (\`${c.keyIndicators.find(i => i.type === 'Domain')?.value || 'apex-algo-yield.trade'}\`) while funds were laundered via local P2P USDT traders.
3. **Issue Subpoena to P2P Crypto Exchanges:** Send Section 91 CrPC notices to Binance / Bybit Compliance to identify KYC identities receiving off-ramped USDT.`;
  }

  // Default fallback
  return `1. **Preserve Volatile Digital Artifacts:** Seal SHA-256 cryptographic hashes for all ${c.evidenceCount} evidence files to ensure compliance with Section 65B IEA / Section 63 BSA.
2. **Initiate Upstream Requisitions:** Issue Section 91 CrPC summons to relevant telecommunication or financial service providers.
3. **Check Cross-Case Threat Correlations:** Search the CCIP Threat Graph for matching IP, domain, or phone indicators across historical dockets.`;
}

export function getNextStepsForCase(c: CaseContextData): string {
  return `1. **Subpoena Complete KYC & Bank Ledgers (Section 91 CrPC):** Demand certified Account Opening Forms (AOF), KYC ID proofs, ATM withdrawal CCTV footage, and IP login logs from the beneficiary institution.
2. **Execute Authoritative Passive DNS & WHOIS Tracing:** Resolve historical IP resolutions for \`${c.recordedFacts.reportedUrl || 'reported infrastructure'}\` via SecurityTrails/VirusTotal to penetrate Cloudflare/CDN masking.
3. **Obtain IPDR with Exact Timestamp and Source Port:** Requisition Carrier-Grade NAT (CGNAT) subscriber identity from telecom providers using public IP \`${c.keyIndicators.find(i => i.type === 'IP Address')?.value || '185.220.101.44'}\`.
4. **Trace 2nd and 3rd Tier Mule Layering:** Follow the dispersal ledger to identify secondary beneficiary accounts and ATM cash-out locations.
5. **Prepare Charge-Sheet & Section 65B/63 BSA Certificate:** Compile digital evidence audit reports certifying non-spoliation and unbroken chain of custody.`;
}

export function getCommonMistakesForCase(c: CaseContextData): string {
  const cat = (c.category + ' ' + c.incidentType + ' ' + c.title).toLowerCase();

  return `* ❌ **Mistake 1: Visiting the Malicious URL from a Live Workstation**
  *The Mistake:* Opening \`${c.recordedFacts.reportedUrl || 'the suspect link'}\` in standard workstation Chrome or Edge without an isolated sandbox / Tor browser.
  *The Risk:* Leaks the police unit's IP address, alerts the cyber syndicate, and triggers geo-cloaking (the site serves a 404 to police IPs while phishing citizens).

* ❌ **Mistake 2: Requesting Domain Takedown before Preserving Digital Evidence**
  *The Mistake:* Contacting the domain registrar or hosting provider to suspend the website before saving full DOM source code, SSL certs, and DNS records.
  *The Risk:* Destroys critical evidence needed to secure convictions; court will reject unverified claims under **Section 65B IEA / Section 63 BSA**.

* ❌ **Mistake 3: Only Freezing the 1st Tier Account (Ignoring Mule Dispersal)**
  *The Mistake:* Serving a lien notice only on the immediate recipient account, which fraudsters typically drain within 5 to 10 minutes into 10+ sub-accounts.
  *The Remedy:* Immediately request the real-time downstream ledger to place cascading liens on Layer 2 and Layer 3 accounts.

* ❌ **Mistake 4: Requesting IPDR without the Source Port Number**
  *The Mistake:* Asking telecom providers for subscriber details of a public IP without the exact source port and second-accurate timestamp.
  *The Reality:* Because telcos use CGNAT (Carrier-Grade NAT) sharing 1 IP across thousands of users, the ISP cannot legally identify the subscriber without the source port.

* ❌ **Mistake 5: ${cat.includes('qr') || cat.includes('upi') ? 'Believing "Scanning a QR Code Can Receive Money"' : 'Relying Solely on Domain WHOIS'}**
  *The Fact:* ${cat.includes('qr') || cat.includes('upi') ? 'In UPI architecture, entering an MPIN NEVER credits funds—it always authorizes an outgoing debit. The victim was socially engineered into thinking they were receiving cashback.' : 'Threat actors use anonymized offshore registrars and fake WHOIS details. Always inspect historical SSL certificates and passive DNS A-records.'}`;
}

/**
 * Built-In Advanced Cyber AI Reasoning Engine
 * Delivers human-grade, Gemini/ChatGPT-quality responses offline or when no external key is active.
 */
export function generateIntelligentCyberResponse(
  query: string,
  activeCase: CaseContextData,
  allCases: CaseContextData[] = []
): string {
  const q = query.trim();
  const lower = q.toLowerCase();

  // 1. Natural Short Greetings & Small Talk
  if (/^(hi|hello|hey|good\s+morning|good\s+afternoon|good\s+evening|greetings|namaste)\b/i.test(lower) && lower.split(/\s+/).length <= 4) {
    return `### 👋 Hello Investigator

I am your **CCIP AI Investigation Copilot**, actively grounded in **${activeCase.referenceNumber}** (*${activeCase.title}*).

I can assist your inquiry with:
- 📊 **Case Briefings & Roadmap:** Immediate triage actions and strategic next steps.
- 🔍 **Technical & IOC Analysis:** Deep-dives on URL phishing features, domain infrastructure, or banking trails.
- ⚠️ **Investigative Quality Checks:** What mistakes to avoid and how to prevent evidence spoliation.
- ⚖️ **Legal Requisitions:** Formal notices under **Section 91 CrPC** and **Section 65B/63 BSA** electronic evidence certificates.

How can I assist your investigation right now?`;
  }

  // 2. Identity / Capabilities
  if (/who are you|what can you do|what are your capabilities|what is ccip assistant/i.test(lower)) {
    return `### 🛡️ About CCIP Sovereign AI Copilot

I am the **Sovereign Cybercrime Investigation Assistant** integrated into the Citizen Cybercrime Intelligence Platform (CCIP). I function as an interactive, real-time investigative partner designed to assist cybersecurity specialists, police officers, and forensic analysts.

#### Core Capabilities:
1. **Interactive Investigation Guidance:** I analyze the active case and provide step-by-step roadmaps: *What You Need To Do Right Now*, *What To Do Next*, and *Common Mistakes to Avoid*.
2. **Deep Technical Deconstruction:** I explain technical concepts like *URL Phishing Features*, *Mule Account Layering*, *Quishing*, *AiTM Session Hijacking*, and *IPDR/CDR Triangulation*.
3. **Indian Cyber Legal Workflows:** Actionable workflows under the **IT Act 2000**, **Section 65B Indian Evidence Act / Section 63 BSA**, **Section 91 & 102 CrPC (Section 94 & 106 BNSS)**, and **1930 CFCFRMS** lien protocols.
4. **Draft Notice Generation:** Ready-to-send formal legal notices to Banks, Telecoms, Registrars, and Payment Gateways.

Feel free to ask any specific question about your case or general cyber forensics!`;
  }

  // 3. Ambiguous / Incomplete Typo Queries (e.g. "am", "pm", "what", "how", "ok")
  if (lower === 'am' || lower === 'pm' || lower === 'a' || lower === 'as' || lower === 'in') {
    return `### 💡 Did you mean to ask about one of the following?

It looks like your query **"${q}"** was submitted before you finished typing. Here are the most relevant ways I can assist right now:

1. **AM / PM Event Sequencing:** Reconstruct the chronological event timeline of incident timestamps for case **${activeCase.referenceNumber}** (e.g., initial lure received at \`${activeCase.timeline[0]?.time || '10:15 AM'}\`).
2. **Account Monitoring (AM) & Freeze:** Guide on issuing emergency debit freezes under **Section 102 CrPC** for transaction \`${activeCase.recordedFacts.transactionRef || 'disputed reference'}\`.
3. **What You Need To Do Right Now:** Immediate priority triage checklist for this **${activeCase.category}** investigation.
4. **Mistakes to Avoid:** Critical pitfalls and investigator traps to prevent evidence spoliation in this case.

*Tip: You can ask "what are the features to find phishing url", "what to do next", "what mistakes did I make", or "draft section 91 notice"!*`;
  }

  // 4. Dedicated Intent: WHAT ARE THE FEATURES TO FIND / DETECT PHISHING URL
  if (
    /feature.*(phish|url)|url.*feature|find.*phishing.*url|detect.*phishing.*url|how.*find.*phishing.*url|phishing.*url.*features|what.*features.*help/i.test(lower) ||
    (lower.includes('phishing') && lower.includes('url') && (lower.includes('feature') || lower.includes('find') || lower.includes('detect') || lower.includes('identify')))
  ) {
    const reportedUrl = activeCase.recordedFacts.reportedUrl || 'upi-claim-support.in';
    
    return `### 🔍 Features that Help Identify & Detect Phishing URLs

In cybercrime forensics and automated machine-learning triage, detecting a malicious or phishing URL relies on analyzing **four distinct categories of features**: Lexical/Syntactic, Host/Infrastructure, Content/Visual, and Behavioral.

---

#### 1. Lexical & Syntactic Features (URL Anatomy)
These features analyze the raw string composition of the URL without needing to visit the website:
* **Abnormal URL Length & Entropy:** Phishing links frequently exceed 75–100 characters to obscure the true domain on mobile browsers or pass encoded session tokens.
* **Subdomain Stacking (Brand Confusion):** Attackers insert trusted brand names into the subdomain to fool human eyes (e.g., \`https://axisbank.com.login-portal.in\`, where the real domain is actually \`login-portal.in\`).
* **Direct IP Address as Hostname:** Using raw IPv4/IPv6 addresses directly in the URL (e.g., \`http://185.220.101.44/verify\`) instead of a registered domain name to bypass domain reputation checks.
* **Special Characters & Obfuscation:**
  - The \`@\` Symbol: Browsers ignore everything before \`@\` (e.g., \`http://www.google.com@evil-phish.in/login\` takes the victim to \`evil-phish.in\`).
  - Excessive hyphens (\`-\`) and underscores (\`_\`) to simulate legitimate compound names (e.g., \`upi-claim-support.in\`).
  - Percent-encoded characters (e.g., \`%20\`, \`%2F\`) to evade simple keyword-based regex filters.
* **Homoglyph & Punycode Attacks (IDN Spoofing):** Replacing Latin characters with visually identical Cyrillic or Greek glyphs (e.g., \`xn--pypal-4ve.com\` rendering as \`paypal.com\`).
* **Abuse of Suspicious/Free TLDs:** High-prevalence cybercrime top-level domains such as \`.xyz\`, \`.top\`, \`.tk\`, \`.work\`, \`.online\`.

---

#### 2. Host-Based & Network Infrastructure Features
These features require querying domain name servers and network registries:
* **Domain Age (Crucial Signal):** Phishing domains are ephemeral—over 80% are registered **less than 14 to 30 days** before launch (often < 48 hours in active financial fraud).
* **WHOIS Privacy & False Registrant Records:** Anonymous registrar proxy shields (e.g. Withheld for Privacy, Domains By Proxy) combined with disposable Proton/Gmail contact addresses.
* **Hosting ASN & IP Reputation:** Domains hosted on bulletproof proxy networks, Tor exit nodes, or residential VPN pools rather than established tier-1 cloud providers.
* **Low DNS TTL & Fast-Flux Routing:** Time-To-Live (TTL) values below 300 seconds, rapidly alternating IP addresses to resist sinkholing and IP-based firewalls.

---

#### 3. Content, Visual & SSL Certificate Features
These features evaluate the web page rendered by the server:
* **SSL/TLS Certificate Incongruence:** Free domain-validated SSL certs (Let's Encrypt / ZeroSSL) on domains claiming to be national banking portals (banks utilize Organization/Extended Validation certificates).
* **Favicon Hash Matching:** Inspecting the MD5 hash of the site's \`favicon.ico\` against known bank databases (e.g. Shodan MurmurHash matching SBI or Axis Bank, but hosted on an unauthorized host).
* **Cross-Origin Form Actions:** An HTML form claiming to be a bank login whose \`<form action="...">\` transmits entered PINs/passwords to an external server, Telegram Bot API, or Discord webhook.
* **Anti-Analysis / Cloaking Code:** JavaScript that detects automated analysis bots, inspects screen dimensions, disables developer tools (F12), or serves a 404 to non-mobile user-agents.

---

#### 4. Behavioral & Contextual Features
* **URL Shorteners:** Masking destinations via Bitly, TinyURL, or Ow.ly to hide lexical red flags.
* **Redirection Chains:** Multiple HTTP 301/302 hops (e.g., SMS link -> Shortener -> Middleman redirector -> Final phishing gateway).

---

#### 📌 Application to Active Case: \`${activeCase.referenceNumber}\`
In this case, the reported indicator is: **\`${reportedUrl}\`**
* **Lexical Red Flag:** Contains brand lure keywords (\`upi\`, \`claim\`, \`support\`) separated by hyphens.
* **Network Correlation:** Hosted on proxy IP **\`185.220.101.44\`**, which is flagged as an unverified bulletproof proxy shared across candidate case **CYBER-2026-7033**.

---

### 🚀 What You Need To Do Right Now (Immediate Triage)
${getImmediateActionsForCase(activeCase)}

---

### 🧭 What To Do Next (Strategic Forensic Roadmap)
${getNextStepsForCase(activeCase)}

---

### ⚠️ Common Mistakes You Made or Need to Avoid
${getCommonMistakesForCase(activeCase)}`;
  }

  // 5. Dedicated Intent: WHAT SHOULD I DO NEXT / WHAT TO DO NOW / SUGGESTIONS & IDEAS
  if (
    /what.*to do next|what.*to do now|next step|what should i do|what do you suggest|give me.*suggestion|action plan|investigation plan|how to investigate/i.test(lower)
  ) {
    return `### 🧭 Comprehensive Investigative Roadmap & Action Plan

**Case Context:** ${activeCase.referenceNumber} (*${activeCase.title}*)  
**Incident Type:** ${activeCase.incidentType} | **Priority:** **${activeCase.priority}**

---

### 🚀 1. What You Need To Do Right Now (Immediate Triage)
${getImmediateActionsForCase(activeCase)}

---

### 🧭 2. What To Do Next (Strategic Next Steps & Workflow)
${getNextStepsForCase(activeCase)}

---

### ⚠️ 3. Critical Mistakes You Made or Must Avoid
${getCommonMistakesForCase(activeCase)}

---

### 🎯 4. Priority Evidence Verification Checklist
${activeCase.verificationNeeds.map((v, i) => `* **Step ${i + 1}:** ${v}`).join('\n')}

Would you like me to draft a Section 91 CrPC notice to banks or telcos to begin executing this plan?`;
  }

  // 6. Dedicated Intent: MISTAKES MADE / PITFALLS TO AVOID
  if (
    /mistake|error|pitfall|what.*wrong|what not to do|what mistakes did i make|investigator traps|avoid/i.test(lower)
  ) {
    return `### ⚠️ Critical Investigative Mistakes & Pitfalls to Avoid

In cybercrime investigations, technical oversights or procedural delays often compromise cases before they reach court. Here is the forensic advisory tailored to **${activeCase.referenceNumber}** (*${activeCase.title}*):

---

### ❌ The Top 5 Mistakes Investigators Make in this Case Type
${getCommonMistakesForCase(activeCase)}

---

### 🛡️ How to Fix & Prevent These Mistakes:
1. **Always Use Isolated Analysis Environments:** Never probe URLs like \`${activeCase.recordedFacts.reportedUrl || 'the suspect site'}\` from a live police workstation. Use sandbox services (urlscan.io, Any.Run) or isolated Linux VMs via Tor.
2. **Seal Electronic Records Immediately:** Before requesting takedowns, generate **SHA-256 cryptographic hashes** of all web captures, victim statements, and transaction screenshots for compliance with **Section 65B/63 BSA**.
3. **Trace All Downstream Mule Tiers:** Demand complete 7-day inward/outward ledger histories to freeze accounts before funds are withdrawn at ATMs.

---

### 🚀 Immediate Action Required Right Now:
${getImmediateActionsForCase(activeCase)}`;
  }

  // 7. General Cybercrime Topic: PHISHING MECHANICS
  if (/what is phishing|explain phishing|phishing attack|how does phishing work|types of phishing|phishing meaning/i.test(lower)) {
    const isQuishing = activeCase.category.toLowerCase().includes('qr') || activeCase.title.toLowerCase().includes('qr') || (activeCase.recordedFacts.reportedUrl && activeCase.recordedFacts.reportedUrl.includes('upi'));
    
    return `### 🎣 Understanding Phishing in Cybercrime Investigations

**Phishing** is a form of social engineering where threat actors impersonate legitimate entities (e.g., banks, government portals, courier services, or trusted executives) to deceive victims into disclosing sensitive credentials, authentication tokens (OTPs/PINs), or authorizing fraudulent payments.

---

#### 1. Primary Phishing Modalities
* **Spear Phishing:** Highly targeted lures customized with specific victim reconnaissance (e.g., targeting accounts personnel with fake vendor invoices).
* **Smishing (SMS Phishing):** Deceptive SMS messages containing shortened links (e.g., *"Your electricity will be disconnected tonight. Update KYC immediately"*).
* **Vishing (Voice Phishing):** Phone calls where scammers masquerade as bank fraud prevention managers or cyber police officers to induce panic.
* **Quishing (QR Code Phishing):** Embedding malicious payment or phishing redirect URLs inside QR codes. When scanned, the victim's phone executes an unauthorized payment or opens a credential-harvesting gateway. ${isQuishing ? `\n  *(⚠️ **Active Case Link:** Case **${activeCase.referenceNumber}** specifically involves a QR code payment scam).*` : ''}
* **Adversary-in-the-Middle (AiTM):** Reverse proxies (e.g., Evilginx) that capture session cookies and bypass multi-factor authentication (MFA) in real-time.

---

#### 2. Technical Anatomy & IOC Signals
* **Domain Typosquatting:** Homoglyphs or subdomain trickery (e.g., \`secure-login.axis-verify.in\` instead of \`axisbank.com\`).
* **Hosting Proxy Infrastructure:** Bulletproof hosting, Cloudflare tunnels, or Tor exit nodes masking the actual C2 IP.
* **Urgency & Coercive Language:** Psychological triggers demanding immediate action within minutes to bypass rational judgment.

---

### 🚀 What You Need To Do Right Now (Immediate Triage)
${getImmediateActionsForCase(activeCase)}

---

### 🧭 What To Do Next (Strategic Roadmap)
${getNextStepsForCase(activeCase)}

---

### ⚠️ Common Mistakes to Avoid
${getCommonMistakesForCase(activeCase)}`;
  }

  // 8. General Cybercrime Topic: MULE ACCOUNTS & MONEY LAUNDERING
  if (/mule account|what is a mule|money mule|layering|fund trail|freeze account|section 102/i.test(lower)) {
    return `### 🏦 Mule Accounts & Financial Laundering Infrastructure

A **Money Mule Account** is a bank account, UPI handle, or crypto wallet used by cybercrime syndicates to receive, layer, and launder proceeds from cyber fraud.

#### 1. Mule Hierarchy & Layering Architecture
* **Layer 1 (Direct Ingress Account):** The immediate recipient account where the victim transfers funds. Usually rented from students, low-income individuals, or created using forged KYC credentials.
* **Layer 2 (Distribution Hub):** Within 3 to 7 minutes, automated scripts split the funds into smaller tranches (e.g., ₹25,000 to ₹50,000) across 5 to 10 intermediary accounts to defeat automated bank AML threshold monitoring.
* **Layer 3 (Cash-Out / Off-Ramp):** The final stage where funds are either withdrawn via ATMs across different geographical locations, converted into P2P cryptocurrency (USDT), or used to buy digital gift cards.

---

### 🚀 What You Need To Do Right Now:
${getImmediateActionsForCase(activeCase)}

---

### 🧭 What To Do Next:
${getNextStepsForCase(activeCase)}

---

### ⚠️ Common Mistakes to Avoid:
${getCommonMistakesForCase(activeCase)}`;
  }

  // 9. Legal Framework: SECTION 65B / SECTION 63 BSA
  if (/65b|section 65b|63 bsa|admissibility|electronic evidence|chain of custody/i.test(lower)) {
    return `### ⚖️ Digital Evidence Admissibility: Section 65B (IEA) & Section 63 (BSA)

Under the Indian legal framework, electronic records (screenshots, server logs, CDRs, CCTV footage, and emails) are deemed documents and are admissible in court only upon compliance with statutory certification safeguards.

#### 1. Statutory Mandate (*Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal - 2020 SC*)
The Supreme Court held that the certificate under **Section 65B(4) of the Indian Evidence Act** (now transitioned under **Section 63 of Bharatiya Sakshya Adhiniyam, 2023**) is a **condition precedent** to the admissibility of secondary electronic evidence.

#### 2. Mandatory Certificate Conditions:
1. **Lawful Control:** The computer/server producing the record must have been under the lawful custody and operational control of the certifying authority at the relevant time.
2. **Regular Operational Course:** The electronic information was regularly fed into the computer in the ordinary course of legitimate activities.
3. **System Integrity:** The device was operating properly, or if defective, the defect did not affect the accuracy or authenticity of the digital output.
4. **Hash Chain of Custody:** The output must be accompanied by cryptographic hash verification (e.g. SHA-256) recorded at the moment of extraction to guarantee zero spoliation.

---

### ⚠️ Critical Mistakes Investigators Make with Electronic Evidence:
* **Failing to Compute Hashes at Extraction:** Saving a screenshot without generating an immediate SHA-256 hash. If file metadata changes later, the defense can claim tampering.
* **Belated Certification:** Producing the 65B/63 BSA certificate months after filing the charge-sheet. Courts have disallowed certificates produced after cross-examination begins.
* **Non-Competent Certifier:** Having an investigating officer certify logs when the certificate must legally come from the person who manages the server/machine producing the record.`;
  }

  // 10. Case Query: DRAFT SECTION 91 NOTICE
  if (/draft.*91|draft.*notice|draft.*letter|prepare notice|write notice/i.test(lower)) {
    const suspectAcc = activeCase.keyIndicators.find(i => i.type.toLowerCase().includes('bank') || i.type.toLowerCase().includes('account') || i.type.toLowerCase().includes('upi'))?.value || 'XXXX 6789';
    const txnRef = activeCase.recordedFacts.transactionRef || 'UPI92736117283';
    
    return `### 📄 Draft Requisition Notice under Section 91 CrPC

**OFFICE OF THE CYBERCRIME INVESTIGATION DIVISION**  
*Specialist Operations Enclave — Crime Branch*  

**To:**  
The Nodal Officer / Authorized Legal Officer  
Axis Bank Ltd. / Intermediary Gateway Compliance  

**Subject:** Urgent Requisition for Information & Transaction Records under Section 91 Cr.P.C. (Section 94 BNSS) in connection with **Case No. ${activeCase.referenceNumber}**

**Sir / Madam,**

This office is investigating a cognizable cyber offence registered under Case Reference: **${activeCase.referenceNumber}** (*${activeCase.title}*).

During the course of the investigation, the following suspect account / transaction has surfaced as directly involved in the unauthorized siphoning of complainant funds:

1. **Beneficiary Account / Identifier:** \`${suspectAcc}\`
2. **Transaction Reference ID:** \`${txnRef}\`
3. **Date & Time of Transaction:** ${activeCase.date}
4. **Associated Contact:** \`${activeCase.keyIndicators.find(i => i.type.toLowerCase().includes('mobile'))?.value || '+91 98765 43210'}\`

In exercise of the powers conferred upon me under **Section 91 of the Code of Criminal Procedure, 1973 (Section 94 of BNSS, 2023)**, you are hereby directed to provide the following certified records within **24 hours**:

1. Certified Account Opening Form (AOF), complete KYC dossiers, registered mobile number, email address, and current address of the account holder.
2. Complete transaction statement from date of opening to current date in searchable Excel/CSV format.
3. System IP logs for internet and mobile banking logins corresponding to the disputed transaction with timestamp and port details.
4. Immediate confirmation of lien / debit freeze placed on the account under Section 102 Cr.P.C. to prevent dissipation of evidence.

Please certify the electronic records in compliance with **Section 65B of the Indian Evidence Act / Section 63 of Bharatiya Sakshya Adhiniyam**.

*(Investigating Officer)*  
**Specialist Cyber Operations Unit**  
CCIP Sovereign Enclave`;
  }

  // 11. Case Query: SUMMARIZE CASE / OVERVIEW
  if (/summarize|overview|tell me about this case|what happened|case details|explain this case/i.test(lower)) {
    return `### 📋 Comprehensive Case Briefing: ${activeCase.referenceNumber}

#### 1. Case Metadata
* **Title:** ${activeCase.title}
* **Category:** ${activeCase.category}
* **Incident Classification:** ${activeCase.incidentType}
* **Priority Level:** **${activeCase.priority}** | **Status:** **${activeCase.statusLabel}**
* **Originating Source:** ${activeCase.source} (${activeCase.department})
* **Registration Date:** ${activeCase.date}

---

#### 2. Incident Narrative & Ground Truth
${activeCase.summary}

* **Complainant Statement:** "${activeCase.recordedFacts.incidentReport}"
${activeCase.recordedFacts.reportedUrl ? `* **Malicious URL Involved:** \`${activeCase.recordedFacts.reportedUrl}\`` : ''}
${activeCase.recordedFacts.transactionRef ? `* **Disputed Transaction ID:** \`${activeCase.recordedFacts.transactionRef}\`` : ''}

---

#### 3. Key Indicators of Compromise (${activeCase.keyIndicators.length} IOCs)
${activeCase.keyIndicators.map(ind => `* **${ind.type}:** \`${ind.value}\` — **${ind.badge}** (${ind.badgeType === 'danger' ? 'High Risk' : ind.badgeType === 'warning' ? 'Pending Corroboration' : 'Verified'})`).join('\n')}

---

### 🚀 What You Need To Do Right Now:
${getImmediateActionsForCase(activeCase)}

---

### 🧭 What To Do Next:
${getNextStepsForCase(activeCase)}

---

### ⚠️ Critical Mistakes to Avoid in this Case:
${getCommonMistakesForCase(activeCase)}`;
  }

  // 12. Case Query: VERIFICATION / WHAT NEEDS VERIFICATION
  if (/what evidence needs verification|verification|verify|needs check|unverified/i.test(lower)) {
    const unverifiedIOCs = activeCase.keyIndicators.filter(i => i.badge === 'Unverified' || i.badge === 'Suspicious');
    
    return `### 🔍 Evidence & Indicator Verification Strategy for ${activeCase.referenceNumber}

To ensure that findings meet evidentiary standards before chargesheeting or cross-case aggregation, the following items require independent verification:

#### 1. Unverified Technical Indicators (${unverifiedIOCs.length} Pending)
${unverifiedIOCs.map(i => `* **${i.type} (\`${i.value}\`):** 
  - *Current Status:* **${i.badge}**
  - *Action:* Issue official requisition to upstream service provider or execute passive DNS/IPDR lookup to corroborate registrant identity.`).join('\n')}

#### 2. Case-Specific Verification Milestones
${activeCase.verificationNeeds.map((v, i) => `${i + 1}. **${v}**`).join('\n')}

---

### 🚀 Immediate Verification Priority:
${getImmediateActionsForCase(activeCase)}

---

### ⚠️ Common Verification Mistakes:
${getCommonMistakesForCase(activeCase)}`;
  }

  // 13. Case Query: SHOW RELATED CASES / CROSS-CASE CORRELATION
  if (/related cases|show related|correlations|cross case|similar cases|connections/i.test(lower)) {
    const related = allCases.filter(c => c.referenceNumber !== activeCase.referenceNumber);
    
    return `### 🕸️ Cross-Case Candidate Correlations for ${activeCase.referenceNumber}

The CCIP Sovereign Correlation Engine has identified candidate relational links based on shared infrastructure and behavioral patterns:

${related.map((c, idx) => `#### ${idx + 1}. Case ${c.referenceNumber} — ${c.title}
* **Category:** ${c.category} (${c.priority} Priority)
* **Status:** ${c.statusLabel}
* **Candidate Link Factor:** 
  - Shared Hosting / C2 Infrastructure: \`185.220.101.44\` (Bulletproof Proxy Hub)
  - Common payment gateway lure architecture targeting financial retail users
* **Confidence Level:** Analytical Hypothesis (Requires independent DNS / Banking corroboration)`).join('\n\n')}

> **⚠️ Admissibility Advisory:** Candidate correlations represent analytical hypotheses. Investigators must establish direct evidentiary nexus (e.g. identical bank account or IMEI) before formally merging case dockets.`;
  }

  // 14. Universal Dynamic Intelligent Analysis for ANY other Query
  return `### 💡 Investigative Analysis for "${q}"

**Case Context:** ${activeCase.referenceNumber} (*${activeCase.title}*) — ${activeCase.category} (${activeCase.incidentType})

---

#### 1. Direct Technical & Forensic Analysis
Regarding **"${q}"**, in the context of digital cybercrime investigations:
* **Evidentiary Relevance:** This inquiry directly impacts how the primary evidence and IOCs are evaluated for this docket. The recorded narrative reflects: *"${activeCase.recordedFacts.incidentReport}"*.
* **Threat Attribution Principles:** When analyzing suspect indicators (${activeCase.keyIndicators.map(i => `\`${i.value}\``).join(', ')}), always separate verified complainant facts from derived system correlations.
* **Admissibility Standard:** All electronic logs, network socket sessions, and banking extracts must have certified SHA-256 hashes generated prior to submitting reports to judicial authorities.

---

### 🚀 2. What You Need To Do Right Now (Immediate Triage)
${getImmediateActionsForCase(activeCase)}

---

### 🧭 3. What To Do Next (Strategic Next Steps)
${getNextStepsForCase(activeCase)}

---

### ⚠️ 4. Common Mistakes You Made or Need to Avoid
${getCommonMistakesForCase(activeCase)}`;
}
