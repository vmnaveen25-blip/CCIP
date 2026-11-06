# CCIP Public AI Assistant: RAG Retrieval & Synthesis Implementation

**Document ID:** CCIP-DOC-CB-005  
**Version:** 1.0.0 (Production)  
**Target Audience:** AI/ML Engineers, Retrieval Specialists, Software Architects  

---

## 1. Retrieval-Augmented Generation (RAG) Architecture

The public CCIP AI Assistant employs a closed-domain, citation-anchored RAG architecture designed to eliminate hallucinations, enforce regulatory safety, and provide unambiguous advisory instructions to Indian citizens facing cybercrime emergencies.

```
Citizen Query: "Money deducted after scanning QR code on OLX"
                       |
                       v
         [ 1. Query Normalization & Preprocessing ]
                       |
                       v
         [ 2. Dense Query Vectorization (384-dim) ]
                       |
                       v
         [ 3. Cosine Similarity Vector Search ]
               (Filters: is_available_for_chatbot == True)
                       |
                       v
         [ 4. Score Thresholding (sim >= 0.35) & Top-K (K=4) ]
                       |
                       v
         [ 5. Grounded Context Prompt Construction ]
                       |
                       v
         [ 6. LLM Generation with Mandatory Citations ]
                       |
                       v
Formatted Response with Step-by-Step Instructions & Verified Source Tags
```

---

## 2. Mathematical Vector Retrieval Model

### 2.1 Cosine Similarity Formulation
For a normalized query embedding vector $\mathbf{q} \in \mathbb{R}^{384}$ and stored candidate chunk embedding $\mathbf{d}_i \in \mathbb{R}^{384}$, the semantic similarity score $S(\mathbf{q}, \mathbf{d}_i)$ is computed as:

$$S(\mathbf{q}, \mathbf{d}_i) = \frac{\mathbf{q} \cdot \mathbf{d}_i}{\|\mathbf{q}\|_2 \|\mathbf{d}_i\|_2}$$

Because embeddings are pre-normalized to unit Euclidean length ($\|\mathbf{d}_i\|_2 = 1, \|\mathbf{q}\|_2 = 1$), the calculation reduces to the inner dot product:

$$S(\mathbf{q}, \mathbf{d}_i) = \sum_{j=1}^{384} q_j \cdot d_{i,j}$$

### 2.2 Ranking and Filtering Criteria
1. **Chatbot Availability Gate:**  
   $$\mathcal{D}_{\text{active}} = \{ d_i \in \mathcal{D} \mid d_i.\text{material.is\_available\_for\_chatbot} = 1 \land d_i.\text{material.processing\_status} = \text{'COMPLETED'} \}$$
2. **Relevance Thresholding:**  
   Candidate chunks must satisfy $S(\mathbf{q}, \mathbf{d}_i) \ge 0.35$. Chunks falling below $0.35$ are discarded as irrelevant noise.
3. **Top-K Selection:**  
   The remaining candidates are sorted in descending order of similarity, and the top $K=4$ passages are retained:
   $$\mathcal{C}_{\text{retrieved}} = \text{Top-4}_{\mathbf{d}_i \in \mathcal{D}_{\text{active}}}(S(\mathbf{q}, \mathbf{d}_i))$$

---

## 3. Prompt Construction & Grounding Contract

The retrieved context passages are assembled into a structured prompt containing the sovereign persona instructions and strict anti-hallucination boundaries.

### 3.1 Grounded Prompt Template
```
System Prompt:
You are the CCIP AI Assistant, the official public artificial intelligence guide for the Citizen Cybercrime Intelligence Platform (CCIP), Government of India.

Your primary directive is to provide clear, actionable, calm, and grounded guidance to citizens reporting cybercrimes or seeking cyber safety advisories.

STRICT INSTRUCTIONS:
1. Base your answer EXCLUSIVELY on the provided Knowledge Context below.
2. If the context does not contain the answer, politely state: "I do not have authoritative information on this specific topic in my verified knowledge base. Please dial 1930 for financial cyber fraud or visit your nearest Cyber Crime Police Station."
3. DO NOT invent, assume, or extrapolate legal penalties, case statuses, or technical advice not present in the context.
4. For all financial fraud complaints, prioritize advising the citizen to dial 1930 within the 'Golden Hours' to initiate an immediate bank nodal freeze.
5. Provide structured, step-by-step numbered instructions when explaining procedures.
6. Always cite the source document title and chunk reference for every fact stated.

KNOWLEDGE CONTEXT:
[Source: {document_title_1}, Chunk #{chunk_index_1}]
{chunk_text_1}

[Source: {document_title_2}, Chunk #{chunk_index_2}]
{chunk_text_2}

Citizen Inquiry:
{citizen_message}
```

---

## 4. Citation Attribution Engine

Every verified chunk that contributes to the final synthesis is tracked and returned in the API response:
```json
{
  "response": "You can report a cybercrime on CCIP by following these steps: ...",
  "citations": [
    {
      "material_id": "a82b4c19-74d1-432c-b8e1-512c1b483e10",
      "material_title": "CCIP Citizen User Guide.pdf",
      "chunk_index": 0,
      "relevance_score": 0.892
    }
  ],
  "is_urgent": false,
  "urgent_action": null
}
```

The frontend widget renders these citations as visual **Verified Sources** tags (`CheckCheck` badge) below the response text, allowing complainants to identify exactly which official circular or manual informed the assistant's answer.

