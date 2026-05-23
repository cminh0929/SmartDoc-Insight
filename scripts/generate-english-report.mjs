import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const diagramDir = path.join(root, 'docs', 'diagrams');
const generatedDir = path.join(diagramDir, 'generated-en');
fs.mkdirSync(generatedDir, { recursive: true });

const diagrams = {
  'usecase-en.mermaid': `flowchart LR
    Admin([System Admin\\nEnterprise Administrator])
    Manager([IT Manager\\nTeam Lead])
    Tech([Helpdesk Technician\\nField Engineer])

    subgraph SmartDoc["SmartDoc Insight SaaS"]
        UC1("Create and Manage Workspace")
        UC2("Configure Custom Roles")
        UC3("Monitor Audit Logs")
        UC4("Manage Folder Structure")
        UC5("Create and Update SOPs")
        UC6("Restore Document Versions")
        UC7("Search Documents Instantly")
        UC8("Ask the RAG AI Assistant")
    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Manager --> UC4
    Manager --> UC5
    Manager --> UC6
    Manager --> UC3
    Manager --> UC8
    Tech --> UC7
    Tech --> UC8
    Tech -. "If authorized" .-> UC5
`,
  'architecture-en.mermaid': `graph TD
    classDef client fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef server fill:#059669,stroke:#047857,stroke-width:2px,color:#fff
    classDef db fill:#d97706,stroke:#b45309,stroke-width:2px,color:#fff
    classDef search fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#fff
    classDef tenant fill:#f3f4f6,stroke:#6b7280,stroke-width:2px,stroke-dasharray:5 5

    subgraph ClientLayer["Client Layer"]
        UI["Next.js Web App\\nReact, Tailwind CSS, Shadcn UI"]:::client
    end

    subgraph ServerLayer["Backend Layer"]
        API["NestJS API Gateway\\nREST API, JWT Guard"]:::server
        Auth["Authentication and Tenant Service"]:::server
        Doc["Document and Folder Service"]:::server
        RBAC["Role and Permission Service"]:::server
        Logs["Audit Log Service"]:::server
        RAG["RAG AI Service"]:::server
        API --> Auth
        API --> Doc
        API --> RBAC
        API --> Logs
        API --> RAG
    end

    subgraph StorageLayer["Data and Intelligence Layer"]
        DB[("PostgreSQL\\nDrizzle ORM")]:::db
        Vector[("PGVector\\nVector Storage")]:::db
        Search[("Meilisearch\\nFull-text Search")]:::search
        FS[/"Local File Storage\\nUploaded Files"/]:::db
        LLM[("OpenAI or Gemini\\nEmbeddings and Generation")]:::search
    end

    subgraph Boundary["SaaS Logical Boundary"]
        TenantA["Tenant A Workspace"]:::tenant
        TenantB["Tenant B Workspace"]:::tenant
    end

    UI -- "HTTP REST\\nJSON and JWT" --> API
    Auth -- "Validate identity and invite code" --> DB
    Doc -- "Store metadata and tenantId" --> DB
    Doc -- "Store uploaded files" --> FS
    Doc -- "Index searchable content" --> Search
    RBAC -- "Evaluate policy" --> DB
    Logs -- "Record immutable events" --> DB
    RAG -- "Cosine similarity search" --> Vector
    RAG -- "Embed queries and generate answers" --> LLM
    DB -. "Scoped by tenantId" .-> Boundary
    Vector -. "Scoped by tenantId" .-> Boundary
    Search -. "Filtered by tenantId" .-> Boundary
`,
  'erd-en.mermaid': `erDiagram
    TENANTS ||--o{ USERS : "has"
    TENANTS ||--o{ FOLDERS : "owns"
    TENANTS ||--o{ ROLES : "defines"
    TENANTS ||--o{ DOCUMENT_CHUNKS : "isolates"
    ROLES ||--o{ USERS : "assigned to"
    FOLDERS ||--o{ FOLDERS : "parent folder"
    FOLDERS ||--o{ DOCUMENTS : "contains"
    DOCUMENTS ||--o{ DOCUMENT_VERSIONS : "keeps history"
    DOCUMENTS ||--o{ DOCUMENT_CHUNKS : "is vectorized into"
    DOCUMENTS ||--o{ AUDIT_LOGS : "generates"
    USERS ||--o{ AUDIT_LOGS : "performs"
    TENANTS {
        uuid id PK
        string name
        string invite_code
    }
    USERS {
        uuid id PK
        string email
        uuid tenant_id FK
        uuid role_id FK
    }
    DOCUMENTS {
        uuid id PK
        string title
        text content
        uuid folder_id FK
        uuid tenant_id FK
    }
    DOCUMENT_CHUNKS {
        uuid id PK
        uuid document_id FK
        uuid tenant_id FK
        text content
        vector embedding
    }
`,
  'search-sequence-en.mermaid': `sequenceDiagram
    autonumber
    actor Tech as Helpdesk Technician
    participant FE as Next.js Frontend
    participant API as NestJS Backend
    participant DB as PostgreSQL
    participant Worker as Background Worker
    participant Meili as Meilisearch
    Tech->>FE: Save a document
    FE->>API: Send create or update request
    API->>DB: Persist document metadata and content
    DB-->>API: Confirm transaction
    API-)Worker: Emit document.changed event
    API-->>FE: Return success immediately
    FE-->>Tech: Show success feedback
    Worker->>Worker: Extract plain text
    Worker->>Meili: Update search index
    Meili-->>Worker: Confirm indexing
`,
  'rag-sequence-en.mermaid': `sequenceDiagram
    autonumber
    actor Tech as Helpdesk Technician
    participant Chat as RAG Chat UI
    participant API as NestJS RAG Service
    participant Vector as PGVector Database
    participant LLM as OpenAI or Gemini
    Tech->>Chat: Ask a technical question
    Chat->>API: Send query with JWT context
    API->>LLM: Generate embedding for the question
    LLM-->>API: Return query vector
    API->>Vector: Search similar chunks with tenantId filter
    Vector-->>API: Return top matching chunks
    API->>LLM: Send context, question, and answer instructions
    LLM-->>API: Return answer with citations
    API-->>Chat: Display answer and source cards
`,
};

for (const [name, content] of Object.entries(diagrams)) {
  fs.writeFileSync(path.join(generatedDir, name), content, 'utf8');
}

function text(content, options = {}) {
  return new TextRun({ text: content, font: 'Calibri', size: options.size ?? 24, bold: options.bold, italics: options.italics, color: options.color });
}

function para(content, options = {}) {
  return new Paragraph({
    children: Array.isArray(content) ? content : [text(content)],
    heading: options.heading,
    alignment: options.alignment,
    spacing: { before: options.before ?? 0, after: options.after ?? 140, line: 300 },
  });
}

function bullet(content) {
  return new Paragraph({
    children: [text(content)],
    bullet: { level: 0 },
    spacing: { after: 90, line: 300 },
  });
}

function image(fileName, caption, width = 560, height = 315) {
  const file = path.join(generatedDir, fileName);
  if (!fs.existsSync(file)) return [para(`[Image missing: ${fileName}]`)];
  return [
    new Paragraph({
      children: [new ImageRun({ data: fs.readFileSync(file), transformation: { width, height } })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 80 },
    }),
    para(caption, { alignment: AlignmentType.CENTER, italics: true, after: 180 }),
  ];
}

function sourceImage(fileName, caption, width = 560, height = 315) {
  const file = path.join(diagramDir, fileName);
  if (!fs.existsSync(file)) return [];
  return [
    new Paragraph({
      children: [new ImageRun({ data: fs.readFileSync(file), transformation: { width, height } })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 80 },
    }),
    para(caption, { alignment: AlignmentType.CENTER, after: 180 }),
  ];
}

function table(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, rowIndex) => new TableRow({
      children: row.map((cell) => new TableCell({
        children: [para(cell, { after: 60 })],
        shading: rowIndex === 0 ? { fill: 'E5E7EB' } : undefined,
      })),
    })),
  });
}

const children = [
  para('SmartDoc Insight', { alignment: AlignmentType.CENTER, before: 240, after: 80, heading: HeadingLevel.TITLE }),
  para('Project Report: AI-Powered Multi-Tenant Knowledge Management System for IT Teams', { alignment: AlignmentType.CENTER, after: 360 }),
  para('Version 1.0.0 | 2026', { alignment: AlignmentType.CENTER, after: 720 }),
  para('Prepared from Chapters 1-7 and project implementation assets.', { alignment: AlignmentType.CENTER, after: 120 }),
  new Paragraph({ children: [new PageBreak()] }),

  para('Executive Summary', { heading: HeadingLevel.HEADING_1 }),
  para('SmartDoc Insight is a web-based SaaS platform designed to help IT support organizations centralize, secure, search, and reuse operational knowledge. The system addresses common weaknesses in traditional file repositories, including weak permission models, slow content discovery, poor auditability, and unsafe data separation across multiple client organizations.'),
  para('The project delivers a production-oriented foundation for a multi-tenant document management and knowledge assistant system. Its core capabilities include workspace onboarding, recursive folder management, document versioning, dynamic role-based access control, full-text search, audit logs, and a Retrieval-Augmented Generation (RAG) AI assistant that answers questions from internal SOPs and technical documents.'),
  para('The implementation uses a modern full-stack architecture: Next.js for the web interface, NestJS for the backend API, PostgreSQL with Drizzle ORM for relational storage, PGVector for semantic retrieval, Meilisearch for fast full-text search, and PM2 for service operation.'),

  para('1. Introduction and Project Objectives', { heading: HeadingLevel.HEADING_1 }),
  para('Modern IT teams maintain large volumes of operational knowledge: troubleshooting guides, standard operating procedures, configuration notes, internal policies, incident response playbooks, and customer-specific technical documentation. As this knowledge grows, general-purpose storage tools such as shared folders, Google Drive, or OneDrive become difficult to control at enterprise scale.'),
  para('The project is built around four major problems: limited fine-grained permissions, inefficient full-text search, missing audit trails, and weak multi-tenant isolation for organizations that serve multiple clients or departments. SmartDoc Insight responds to these problems by offering a dedicated knowledge management platform for IT teams.'),
  para('Project objectives include:'),
  bullet('Provide a centralized workspace for IT documentation and SOPs.'),
  bullet('Support enterprise-grade tenant isolation across organizations.'),
  bullet('Enable fast keyword search and AI-assisted semantic question answering.'),
  bullet('Provide dynamic RBAC so each tenant can model its own organizational roles.'),
  bullet('Preserve traceability through audit logs and document version history.'),
  bullet('Deliver a responsive, production-ready web application for desktop and mobile users.'),
  ...image('usecase-en.png', 'Figure 1. SmartDoc Insight use case diagram.'),

  para('2. System Architecture and Technology Stack', { heading: HeadingLevel.HEADING_1 }),
  para('SmartDoc Insight follows a client-server architecture with clear separation between presentation, business logic, and data services. The frontend communicates with the backend through REST APIs secured by JWT authentication. The backend validates identity, applies tenant scope, checks permissions, executes business logic, and coordinates persistence, search indexing, and AI retrieval.'),
  para('For RAG workflows, the backend generates embeddings for questions, retrieves relevant document chunks from PGVector under a strict tenant filter, and sends the selected context to an LLM to generate grounded answers with source citations.'),
  ...image('architecture-en.png', 'Figure 2. High-level system architecture.'),
  table([
    ['Layer', 'Technology', 'Purpose'],
    ['Frontend', 'Next.js, React, Tailwind CSS, Shadcn UI', 'Responsive application interface and reusable UI components'],
    ['Backend', 'NestJS', 'REST API, authentication, authorization, domain services'],
    ['Database', 'PostgreSQL, Drizzle ORM', 'Type-safe relational persistence and tenant-scoped records'],
    ['Vector Search', 'PGVector', 'Semantic retrieval for RAG document chunks'],
    ['Full-text Search', 'Meilisearch', 'Fast keyword search with typo tolerance'],
    ['Operations', 'PM2', 'Process supervision for frontend and backend services'],
  ]),

  para('3. Database Design and Multi-Tenancy Strategy', { heading: HeadingLevel.HEADING_1 }),
  para('The system adopts a shared-database, shared-schema multi-tenant model for version 1.0.0. All tenant data is stored in the same PostgreSQL database and schema, while logical isolation is enforced through tenant-scoped records. Core business tables include a tenant identifier so data access can be filtered by the user workspace.'),
  para('This approach reduces operational cost, simplifies migrations, and keeps the first production version maintainable. The main security requirement is strict enforcement: every query that reads or mutates tenant data must include the caller tenant context. The same rule applies to vector chunks used by the RAG assistant so semantic retrieval cannot leak knowledge across organizations.'),
  ...image('erd-en.png', 'Figure 3. Core entity relationship diagram.'),
  para('The workspace invite code flow improves onboarding. A founder or administrator creates an organization, receives a short invite code, and shares it with employees. When a user registers and enters the invite code, the system associates the user with the corresponding tenant and assigns an initial role.'),

  para('4. Core Features and Business Workflows', { heading: HeadingLevel.HEADING_1 }),
  para('Dynamic RBAC allows administrators to define custom roles such as Helpdesk L1, Network Engineer, Security Auditor, or IT Manager. Each role can be assigned specific permissions. Backend guards evaluate these permissions before protected operations are executed. Unauthorized actions return a controlled error instead of exposing data or mutating resources.'),
  para('The folder system supports recursive organization through parent-child folder relationships. This allows teams to create deep operational structures such as Network Infrastructure / Firewall / Cisco / Cisco Firepower. Document versioning protects against accidental data loss by storing snapshots when content changes, enabling administrators to review history and restore earlier versions.'),
  para('Search synchronization is handled asynchronously. When a document is created or updated, the API returns success after the database transaction, while a background process extracts plain text and updates the Meilisearch index. This keeps the user interface responsive while preserving near-real-time search freshness.'),
  ...image('search-sequence-en.png', 'Figure 4. Asynchronous search indexing workflow.'),
  para('The RAG AI assistant extends the document repository into an interactive knowledge interface. Uploaded Word and PDF files are parsed, split into chunks, embedded, and stored in PGVector. When users ask questions, the system retrieves relevant tenant-scoped chunks and generates an answer with citations to original sources.'),
  ...image('rag-sequence-en.png', 'Figure 5. RAG question-answering workflow.'),

  para('5. User Interface and User Experience', { heading: HeadingLevel.HEADING_1 }),
  para('The user experience is designed as a modern B2B SaaS interface for IT professionals. The interface emphasizes a dark-mode workspace, clear navigation, fast feedback, and responsive layouts suitable for both desktop administrators and mobile field technicians.'),
  para('Micro-interactions improve perceived quality and workflow clarity. Modals, navigation transitions, and assistant panels use smooth motion, while toast notifications confirm important actions such as login, saving settings, copying invite codes, and creating resources.'),
  para('The following screenshots illustrate the implemented application interface. The screenshots are included as project evidence and are captioned in English for report consistency.'),
  ...sourceImage('demo_register.png', 'Figure 6. Workspace registration and tenant creation screen.', 520, 300),
  ...sourceImage('demo_dashboard.png', 'Figure 7. Dashboard overview screen.', 520, 300),
  ...sourceImage('demo_create_folder.png', 'Figure 8. Folder creation modal for recursive folder management.', 520, 300),
  ...sourceImage('demo_roles.png', 'Figure 9. Role and permission management screen.', 520, 300),
  para('The RAG assistant is presented as a floating chat panel integrated with the main workspace. It supports real-time answer rendering, citation source cards, and automatic scrolling, allowing technicians to ask operational questions without leaving their current workflow.'),

  para('6. Deployment and Security', { heading: HeadingLevel.HEADING_1 }),
  para('The project uses PM2 to run and supervise the production frontend and backend services. The configured services are frontend-3000 for Next.js on port 3000 and backend-3001 for NestJS on port 3001. PM2 provides process monitoring, restart behavior, log aggregation, and simple operational commands for starting, stopping, and restoring services.'),
  para('Security is implemented across multiple layers. CORS restricts backend access to approved frontend origins. JWT authentication carries user and tenant identity. Authorization guards enforce role and permission rules. Tenant ownership checks prevent cross-tenant access even when a user guesses or submits another tenant resource identifier.'),
  para('Audit logs provide accountability by recording sensitive operations such as creating, updating, and deleting documents or folders. The system is designed to answer the operational questions: who performed an action, what object was affected, and when the event occurred.'),
  para('The project also includes automated tenant-isolation validation. The test strategy creates separate tenants, users, folders, documents, and vector chunks, then attempts unauthorized cross-tenant reads, updates, deletes, and semantic retrieval. The expected result is a controlled denial such as 403 Forbidden or 404 Not Found.'),

  para('7. Conclusion and Future Development', { heading: HeadingLevel.HEADING_1 }),
  para('SmartDoc Insight version 1.0.0 establishes a strong foundation for an enterprise-grade, AI-powered knowledge management system. The project moves beyond a simple internal prototype by supporting multi-tenant architecture, dynamic authorization, document lifecycle management, fast search, auditability, and RAG-based question answering.'),
  para('The most important outcome is the combination of structured document management with an AI assistant grounded in the organization’s own knowledge base. This directly supports IT support workflows where technicians need fast, accurate, and source-backed guidance while resolving incidents.'),
  para('Recommended future work for version 2.x includes:'),
  bullet('Hybrid search that combines Meilisearch keyword results with PGVector semantic results.'),
  bullet('Vector query caching to reduce LLM and embedding costs for repeated questions.'),
  bullet('Personalized chat history for each technician.'),
  bullet('Multi-model fallback to improve AI availability during provider incidents.'),
  bullet('Enterprise SSO through SAML or OIDC with Microsoft Entra ID and Google Workspace.'),
  bullet('Webhook integrations with Slack and Microsoft Teams for knowledge update notifications.'),

  para('References and Project Assets', { heading: HeadingLevel.HEADING_1 }),
  para('This report was synthesized from docs/chapter1.md through docs/chapter7.md, source diagrams under docs/diagrams, and implementation artifacts in the frontend and backend project folders. All generated diagrams and report captions are written in English.'),
];

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 24 }, paragraph: { spacing: { line: 300 } } },
    },
  },
  sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children }],
});

const outPath = path.join(root, 'SmartDoc_Insight_Project_Report_EN.docx');
await Packer.toBuffer(doc).then((buffer) => fs.writeFileSync(outPath, buffer));
console.log(outPath);
