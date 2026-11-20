import fs from 'fs';
import path from 'path';
import PptxGenJS from 'pptxgenjs';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

const ROOT_DIR = process.cwd();
const ASSETS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'obu');
const OUT_DIR = path.join(ROOT_DIR, 'public', 'defence');

fs.mkdirSync(OUT_DIR, { recursive: true });

const OBU_NAVY = '101B35';
const OBU_GOLD = 'D4AF37';
const OBU_GOLD_DARK = 'B59024';
const OBU_SLATE_BG = 'F4F6FA';
const TEXT_DARK = '1E293B';
const TEXT_MUTED = '475569';
const BORDER_LIGHT = 'CBD5E1';

const LOGO_PATH = path.join(ASSETS_DIR, 'obu-logo.png');
const CAMPUS_HERO_PATH = path.join(ASSETS_DIR, 'obu-campus-hero.jpg');
const CAMPUS_2_PATH = path.join(ASSETS_DIR, 'campus-2.jpg');
const CAMPUS_4_PATH = path.join(ASSETS_DIR, 'campus-4.jpg');

// ---------------------------------------------------------------------------
// 1. GENERATE ACADEMIC DEFENCE PAPER REPORT (.docx)
// ---------------------------------------------------------------------------
function makeHeading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 140 },
    border: {
      bottom: {
        color: OBU_GOLD,
        space: 4,
        style: BorderStyle.SINGLE,
        size: 12,
      },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 30,
        color: OBU_NAVY,
        font: 'Georgia',
      }),
    ],
  });
}

function makeHeading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 90 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
        color: OBU_NAVY,
        font: 'Calibri',
      }),
    ],
  });
}

function makeBody(text: string, options?: { boldPrefix?: string; italic?: boolean }): Paragraph {
  const children: TextRun[] = [];
  if (options?.boldPrefix) {
    children.push(
      new TextRun({
        text: options.boldPrefix,
        bold: true,
        size: 22,
        color: TEXT_DARK,
        font: 'Calibri',
      })
    );
  }
  children.push(
    new TextRun({
      text,
      italics: options?.italic,
      size: 22,
      color: TEXT_DARK,
      font: 'Calibri',
    })
  );
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    children,
  });
}

function makeBullet(boldPrefix: string, text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 260 },
    children: [
      new TextRun({
        text: boldPrefix ? `${boldPrefix}: ` : '',
        bold: true,
        size: 21,
        color: OBU_NAVY,
        font: 'Calibri',
      }),
      new TextRun({
        text,
        size: 21,
        color: TEXT_DARK,
        font: 'Calibri',
      }),
    ],
  });
}

function makeStyledTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h) =>
        new TableCell({
          shading: { fill: OBU_NAVY, type: ShadingType.CLEAR },
          margins: { top: 110, bottom: 110, left: 130, right: 130 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: h,
                  bold: true,
                  size: 20,
                  color: 'FFFFFF',
                  font: 'Calibri',
                }),
              ],
            }),
          ],
        })
    ),
  });

  const dataRows = rows.map(
    (r, idx) =>
      new TableRow({
        children: r.map(
          (cellText) =>
            new TableCell({
              shading: {
                fill: idx % 2 === 1 ? OBU_SLATE_BG : 'FFFFFF',
                type: ShadingType.CLEAR,
              },
              margins: { top: 90, bottom: 90, left: 130, right: 130 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText,
                      size: 19,
                      color: TEXT_DARK,
                      font: 'Calibri',
                    }),
                  ],
                }),
              ],
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: OBU_NAVY },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: OBU_NAVY },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_LIGHT },
      right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_LIGHT },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER_LIGHT },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER_LIGHT },
    },
    rows: [headerRow, ...dataRows],
  });
}

async function buildDefenceReportDocx(): Promise<string> {
  const logoBuffer = fs.readFileSync(LOGO_PATH);
  const campusBuffer = fs.readFileSync(CAMPUS_2_PATH);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
            color: TEXT_DARK,
          },
        },
      },
    },
    sections: [
      // SECTION 1: COVER / TITLE PAGE
      {
        properties: {
          page: {
            margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 160 },
            children: [
              new ImageRun({
                data: logoBuffer,
                transformation: { width: 110, height: 110 },
                type: 'png',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: 'ODA BULTUM UNIVERSITY',
                bold: true,
                size: 36,
                color: OBU_NAVY,
                font: 'Georgia',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 320 },
            children: [
              new TextRun({
                text: '"Productive Mind for Development"',
                italics: true,
                bold: true,
                size: 24,
                color: OBU_GOLD_DARK,
                font: 'Georgia',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 280 },
            children: [
              new TextRun({
                text: 'PROJECT DEFENCE PAPER & TECHNICAL REPORT',
                bold: true,
                size: 24,
                color: TEXT_MUTED,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 200 },
            border: {
              top: { color: OBU_GOLD, space: 12, style: BorderStyle.SINGLE, size: 18 },
              bottom: { color: OBU_GOLD, space: 12, style: BorderStyle.SINGLE, size: 18 },
            },
            children: [
              new TextRun({
                text: 'Design and Implementation of a Cloud-Enabled Per Diem & Travel Authorization Management System for Oda Bultum University',
                bold: true,
                size: 34,
                color: OBU_NAVY,
                font: 'Georgia',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 300 },
            children: [
              new ImageRun({
                data: campusBuffer,
                transformation: { width: 420, height: 220 },
                type: 'jpg',
              }),
            ],
          }),
          makeStyledTable(
            ['Institutional Parameter', 'Specification'],
            [
              ['Institution', 'Oda Bultum University (Chiro Main Campus, West Hararghe, Oromia)'],
              ['Target Directorate', 'Directorate of Finance & Office of Academic & Research Vice President'],
              ['System Title', 'OBU Official Per Diem Management System'],
              ['Primary Architecture', 'React 19 + TypeScript + Vite 8 + Firebase Cloud Firestore & Google Auth'],
              ['Official Voucher Forms', 'OBU-FIN-08 (Payment Voucher) & OBU-FIN-RPT (Summary Audit Report)'],
              ['Submission Date', 'November 2026'],
            ]
          ),
          new Paragraph({ children: [new PageBreak()] }),
        ],
      },
      // SECTION 2: MAIN REPORT BODY
      {
        properties: {
          page: {
            margin: { top: 1100, bottom: 1100, left: 1150, right: 1150 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Oda Bultum University — Per Diem Management System Defence Report',
                    size: 18,
                    italics: true,
                    color: TEXT_MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Oda Bultum University ("Productive Mind for Development")   |   Page ',
                    size: 18,
                    color: TEXT_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: OBU_NAVY,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          makeHeading1('Abstract'),
          makeBody(
            'Manual management of academic and administrative travel authorizations, daily subsistence allowances, lodging entitlements, and disbursement vouchers at public universities introduces calculation discrepancies, slow inter-office routing, and fragmented audit trails. This report presents the design, security engineering, and cloud deployment of the Oda Bultum University (OBU) Official Per Diem Management System—a multi-role web platform built with React, TypeScript, Tailwind CSS, and Firebase Cloud Firestore.'
          ),
          makeBody(
            'The system digitizes the complete three-stage university lifecycle: (1) Employee travel claim submission with an automated Ethiopian Birr (ETB) rate calculator factoring staff tier, destination cost-of-living index, and transport mode; (2) Administrator governance covering pending employee account authorization, officer provisioning, and budget-aligned claim approval or rejection; and (3) Finance Directorate treasury settlement via CBE Bank Transfer, Telebirr, Cheque, or Cash with immediate generation of formal OBU-FIN-08 Payment Vouchers and OBU-FIN-RPT institutional reports. Real-time synchronization is enforced under Zero-Trust Firestore security rules protecting Personally Identifiable Information (PII), preventing privilege escalation, and locking disbursed financial records against tampering.'
          ),

          makeHeading1('Chapter 1: Introduction'),
          makeHeading2('1.1 Institutional Background'),
          makeBody(
            'Oda Bultum University (established 2015 in Chiro, West Hararghe Zone, Oromia Regional State, Ethiopia) operates across multiple academic colleges, research stations, and administrative directorates guided by the institutional motto "Productive Mind for Development." Faculty members, agricultural field researchers, and administrative officers regularly travel to federal ministries in Addis Ababa, partner universities such as Adama Science & Technology University and Hawassa University, and remote rural Woreda research stations.'
          ),
          makeHeading2('1.2 Statement of the Problem'),
          makeBody(
            'Prior to digitization, per diem requests relied on manual paper forms circulated physically across departments, Deans, Academic Vice Presidents, and Finance cashiers. This legacy workflow produced four major operational bottlenecks:'
          ),
          makeBullet(
            'Manual Calculation Errors',
            'Inconsistent application of subsistence rates, lodging caps, destination living-index multipliers, and transport allowances led to frequent voucher rejections at the Finance desk.'
          ),
          makeBullet(
            'Approval Delays & Lack of Visibility',
            'Employees lacked real-time status tracking for pending submissions, while administrators had no centralized digital queue to review remarks or historical ceilings.'
          ),
          makeBullet(
            'Fragmented Registration & Identity Governance',
            'Without centralized account authorization, newly hired university personnel could not be verified across separate devices or browsers.'
          ),
          makeBullet(
            'Audit & Archiving Risk',
            'Physical payment vouchers and summary ledgers were vulnerable to loss, inconsistent formatting, and time-consuming manual reconciliation.'
          ),

          makeHeading2('1.3 Objectives of the Project'),
          makeBody('The general objective is to deliver a secure, cloud-synchronized per diem management portal tailored to Oda Bultum University financial regulations. Specific objectives include:'),
          makeBullet('Role-Verified Authentication', 'Separate self-registered Employees (requiring Administrator approval), Administrators, and Finance Officers with verified Google Identity Federation and SHA-256 salted credential verification.'),
          makeBullet('Automated ETB Per Diem Engine', 'Eliminate arithmetic errors by automatically computing daily meals, lodging, incidentals (200 ETB/day), destination multipliers, and transport allowances.'),
          makeBullet('Real-Time Multi-Device Cloud Sync', 'Persist registrations, claims, approvals, and vouchers in Cloud Firestore so updates propagate instantaneously across campus offices and remote browsers.'),
          makeBullet('Zero-Trust Data Protection', 'Enforce strict Firestore security rules for PII isolation, sequential state transitions, terminal voucher immutability, and schema validation.'),
          makeBullet('Standardized Voucher Output', 'Generate clean, printable OBU-FIN-08 Payment Vouchers and OBU-FIN-RPT Institutional Summary Reports.'),

          makeHeading2('1.4 Scope and Delimitation'),
          makeBody(
            'The system covers OBU staff enrollment, Administrator account authorization and claim review, Finance disbursement recording, printable vouchers, and cloud deployment on Netlify/Cloud Run backed by Firebase. Direct core-banking API integration with Commercial Bank of Ethiopia (CBE) or Telebirr is out of scope for Phase 1; Finance officers record verified bank/Telebirr transaction reference numbers directly upon settlement.'
          ),

          makeHeading1('Chapter 2: System Policy & Per Diem Calculation Model'),
          makeHeading2('2.1 Standardized Allowance Matrix (ETB)'),
          makeBody(
            'The calculation module (src/utils/perDiemCalculator.ts) codifies Oda Bultum University allowance schedules across three staff classifications, three destination living-cost categories, and four approved transportation modes.'
          ),
          makeStyledTable(
            ['Staff Classification Tier', 'Daily Subsistence', 'Daily Lodging', 'Regional City (1.00x)', 'Addis Ababa (1.25x)', 'Remote Field (1.15x)'],
            [
              ['SENIOR_ACADEMIC (Professor / Dean)', '1,200 ETB', '1,800 ETB', '3,000 ETB/day', '3,750 ETB/day', '3,450 ETB/day'],
              ['LECTURER_RESEARCHER (Lecturer / Researcher)', '900 ETB', '1,400 ETB', '2,300 ETB/day', '2,875 ETB/day', '2,645 ETB/day'],
              ['ADMIN_SUPPORT (Admin & Support Staff)', '600 ETB', '1,000 ETB', '1,600 ETB/day', '2,000 ETB/day', '1,840 ETB/day'],
            ]
          ),
          new Paragraph({ spacing: { after: 120 }, children: [] }),
          makeHeading2('2.2 Transportation & Contingency Formulas'),
          makeBullet('UNIVERSITY_VEHICLE (Official Fleet)', '0 ETB transport allowance (fuel covered by university fleet voucher).'),
          makeBullet('PUBLIC_TRANSPORT (Intercity Bus / Minibus)', '600 ETB fixed intercity transit allowance.'),
          makeBullet('FLIGHT (Domestic Flight)', '350 ETB airport shuttle/transit allowance.'),
          makeBullet('PERSONAL_CAR (Approved Personal Vehicle)', '1,200 ETB fuel and maintenance subsidy.'),
          makeBullet('Contingency / Incidentals', 'Fixed 200 ETB per travel day for minor official communications and transit expenses.'),
          makeBody(
            'Grand Total Formula: Total Per Diem = (round(Meal * M) + round(Lodging * M)) * Days + (200 * Days) + TransportAllowance, where M is the destination multiplier (1.25, 1.00, or 1.15).'
          ),

          makeHeading1('Chapter 3: System Architecture & Database Design'),
          makeHeading2('3.1 Technology Stack'),
          makeStyledTable(
            ['Architectural Layer', 'Technology Choice', 'Engineering Justification'],
            [
              ['Frontend Framework', 'React 19 + TypeScript', 'Modular component architecture with compile-time type safety across portals.'],
              ['Build & Styling', 'Vite 8 + Tailwind CSS 4', 'Sub-second production bundling and responsive Navy (#101B35) / Gold (#D4AF37) UI.'],
              ['Authentication', 'Firebase Auth (Google OAuth Popup) + SHA-256 Web Crypto', 'Verified institutional/Google email tokens paired with salted portal credential hashes.'],
              ['Cloud Database', 'Cloud Firestore (Enterprise Edition)', 'Real-time onSnapshot synchronization across laptops, phones, and office desktops.'],
              ['CI/CD & Hosting', 'GitHub + Netlify + netlify.toml', 'Automated production builds with SPA routing and Node 22 build environment.'],
            ]
          ),
          new Paragraph({ spacing: { after: 120 }, children: [] }),

          makeHeading2('3.2 Cloud Firestore Data Model (5 Collections)'),
          makeStyledTable(
            ['Collection Path', 'Document Key', 'Primary Purpose & Access Scope'],
            [
              ['/staff_accounts/{uid}', 'Firebase UID', 'Staff profiles, Employee ID, tier, role, accountStatus (ACTIVE | PENDING_APPROVAL | REJECTED). PII isolated to Owner or Admin.'],
              ['/admins/{uid}', 'Firebase UID', 'Trusted System Administrator role grants verified by Firestore rules (no custom token claims).'],
              ['/finance_officers/{uid}', 'Firebase UID', 'Trusted Finance Directorate officer role grants enabling treasury settlement.'],
              ['/account_invitations/{inviteEmail}', 'Lowercase Email', 'Admin-issued authorizations for Finance/Admin onboarding; atomically claimed via writeBatch on first Google sign-in.'],
              ['/travel_requests/{requestId}', 'req_{timestamp}', 'Travel claims, ETB breakdown, approval decision, and OBU-FIN-08 payment voucher details.'],
            ]
          ),
          new Paragraph({ spacing: { after: 120 }, children: [] }),

          makeHeading2('3.3 Sequential Workflow State Machine'),
          makeBody(
            'Travel claims strictly follow an enforced state machine preventing stage skipping:'
          ),
          makeBullet('Stage 1 — SUBMITTED_FOR_APPROVAL', 'Created solely by an ACTIVE Employee bound to their verified Firebase UID (employeeUid == request.auth.uid). Cannot include pre-populated approval or payment blocks.'),
          makeBullet('Stage 2 — APPROVED_BY_ADMIN or REJECTED_BY_ADMIN', 'Transitioned exclusively by an Administrator with timestamped decision remarks. Rejected claims return to the Employee view; approved claims move to the Finance payment queue.'),
          makeBullet('Stage 3 — COMPLETED (Terminal State)', 'Transitioned exclusively by a Finance Officer or Administrator once CBE/Telebirr/Cheque/Cash reference and voucher number are recorded. Locked immutable thereafter except Admin override.'),

          makeHeading1('Chapter 4: Security Engineering & Implementation'),
          makeHeading2('4.1 Zero-Trust Security Architecture'),
          makeBody(
            'Security rules (firestore.rules) enforce defense-in-depth across every read and write operation, beginning with a global default-deny catch-all rule and requiring request.auth != null && request.auth.token.email_verified == true across every collection.'
          ),
          makeBullet('Anti-Privilege-Escalation', 'Public self-registration in /staff_accounts/{uid} is mathematically forced to role == "EMPLOYEE" and accountStatus == "PENDING_APPROVAL". Owner updates strictly forbid modifying role or accountStatus via affectedKeys().hasOnly().'),
          makeBullet('Admin & Finance Invitation Atomicity', 'Provisioned officers receive an ACTIVE record in /account_invitations/{email}. Upon first Google sign-in, a Firestore writeBatch atomically creates /staff_accounts/{uid}, grants /admins/{uid} or /finance_officers/{uid}, and updates the invitation to CLAIMED.'),
          makeBullet('Strict Schema & Shadow Field Defense', 'Every collection validates required keys with keys().hasAll() and blocks unauthorized ghost fields with keys().hasOnly() plus string .size() bounds and numeric range constraints.'),
          makeBullet('Structured Error Handling & Recovery', 'All Firestore operations and onSnapshot listeners route errors through handleFirestoreError() and a top-level React ErrorBoundary displaying clear permission or daily quota diagnostics.'),

          makeHeading1('Chapter 5: Testing, Security Audit & Deployment'),
          makeHeading2('5.1 Verification Summary'),
          makeStyledTable(
            ['Verification Gate', 'Tool / Method', 'Outcome'],
            [
              ['Static Type Safety', 'tsc --noEmit (TypeScript Compiler)', 'Passed with 0 type errors across all modules.'],
              ['Production Bundle Build', 'vite build (Vite 8.3.8)', 'Passed cleanly; generated dist/ assets including OBU branding.'],
              ['Security Rules Static Analysis', 'npx eslint firestore.rules (@firebase/eslint-plugin-security-rules)', 'Passed with 0 errors or warnings.'],
              ['Adversarial "Dirty Dozen" Audit', '12 Attack Payloads (unauthenticated read, role spoofing, state shortcutting, shadow fields, PII scrape, ID/timestamp forgery)', 'All 12 attack classes explicitly blocked by firestore.rules.'],
              ['CI/CD Dependency Resolution', '.npmrc (legacy-peer-deps=true) + netlify.toml', 'Resolved npm ERESOLVE peer conflict for clean Netlify builds.'],
            ]
          ),
          new Paragraph({ spacing: { after: 120 }, children: [] }),

          makeHeading1('Chapter 6: Conclusion & Recommendations'),
          makeHeading2('6.1 Conclusion'),
          makeBody(
            'The Oda Bultum University Official Per Diem Management System successfully replaces error-prone paper workflows with an accessible, cloud-native, institutional platform. By combining automated ETB per diem calculation, real-time multi-device Firestore synchronization, and formal OBU-FIN-08 payment voucher generation under Zero-Trust security controls, the system delivers full transparency for university staff, administrative approvers, and Finance Directorate officers.'
          ),
          makeHeading2('6.2 Recommendations for Future Work'),
          makeBullet('Institutional HR/Payroll Integration', 'Synchronize active employee registries directly with OBU Human Resources ERP databases.'),
          makeBullet('Automated Email & SMS Notifications', 'Trigger instant alerts to employees upon account authorization, claim review, and CBE disbursement.'),
          makeBullet('Bank & Telebirr API Reconciliation', 'Integrate payment gateway webhooks for automated transaction reference verification at the Finance desk.'),
          makeBullet('Quarterly Rules Review', 'Conduct periodic reviews of firestore.rules and authorized domains as university departments scale.'),
        ],
      },
    ],
  });

  const outPath = path.join(OUT_DIR, 'OBU_Per_Diem_Defence_Report.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  return outPath;
}

// ---------------------------------------------------------------------------
// 2. GENERATE POWERPOINT DEFENCE PRESENTATION (.pptx)
// ---------------------------------------------------------------------------
function addSlideChrome(
  slide: PptxGenJS.Slide,
  title: string,
  subtitle: string,
  slideNumber: number,
  totalSlides: number
) {
  slide.background = { color: OBU_SLATE_BG };

  // Top Navy Header Bar
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: 13.333,
    h: 1.08,
    fill: { color: OBU_NAVY },
    line: { type: 'none' },
  });

  // Gold Accent Strip
  slide.addShape('rect', {
    x: 0,
    y: 1.08,
    w: 13.333,
    h: 0.06,
    fill: { color: OBU_GOLD },
    line: { type: 'none' },
  });

  // University Crest in Top-Left Header
  slide.addImage({
    path: LOGO_PATH,
    x: 0.35,
    y: 0.14,
    w: 0.78,
    h: 0.78,
  });

  slide.addText(title, {
    x: 1.3,
    y: 0.16,
    w: 10.8,
    h: 0.45,
    fontFace: 'Georgia',
    fontSize: 22,
    bold: true,
    color: 'FFFFFF',
  });

  slide.addText(subtitle, {
    x: 1.3,
    y: 0.62,
    w: 10.8,
    h: 0.3,
    fontFace: 'Calibri',
    fontSize: 12,
    color: OBU_GOLD,
  });

  // Footer
  slide.addShape('rect', {
    x: 0,
    y: 7.08,
    w: 13.333,
    h: 0.42,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER_LIGHT, width: 0.5 },
  });

  slide.addText('Oda Bultum University  |  "Productive Mind for Development"  |  Official Per Diem Management System', {
    x: 0.45,
    y: 7.13,
    w: 10.0,
    h: 0.3,
    fontFace: 'Calibri',
    fontSize: 10,
    color: TEXT_MUTED,
  });

  slide.addText(`Slide ${slideNumber} of ${totalSlides}`, {
    x: 11.4,
    y: 7.13,
    w: 1.5,
    h: 0.3,
    align: 'right',
    fontFace: 'Calibri',
    fontSize: 10,
    bold: true,
    color: OBU_NAVY,
  });
}

function addCard(
  slide: PptxGenJS.Slide,
  x: number,
  y: number,
  w: number,
  h: number,
  heading: string,
  bullets: string[],
  accentTop = OBU_NAVY
) {
  slide.addShape('roundRect', {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    fill: { color: 'FFFFFF' },
    line: { color: BORDER_LIGHT, width: 0.75 },
  });
  slide.addShape('rect', {
    x,
    y,
    w,
    h: 0.08,
    fill: { color: accentTop },
    line: { type: 'none' },
  });
  slide.addText(heading, {
    x: x + 0.22,
    y: y + 0.2,
    w: w - 0.44,
    h: 0.38,
    fontFace: 'Calibri',
    fontSize: 15,
    bold: true,
    color: OBU_NAVY,
  });
  const textItems = bullets.map((b) => ({
    text: b,
    options: {
      bullet: { code: '2022' },
      paraSpaceAfter: 7,
      fontFace: 'Calibri',
      fontSize: 12.5,
      color: TEXT_DARK,
    },
  }));
  slide.addText(textItems, {
    x: x + 0.22,
    y: y + 0.65,
    w: w - 0.44,
    h: h - 0.8,
    valign: 'top',
  });
}

async function buildDefencePresentationPptx(): Promise<string> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Oda Bultum University';
  pptx.company = 'Oda Bultum University';
  pptx.subject = 'Per Diem Management System Project Defence';
  pptx.title = 'OBU Official Per Diem Management System';

  const TOTAL = 12;

  // SLIDE 1: TITLE SLIDE
  {
    const s1 = pptx.addSlide();
    s1.background = { color: OBU_NAVY };

    // Right campus photo panel
    s1.addImage({
      path: CAMPUS_2_PATH,
      x: 7.55,
      y: 0.6,
      w: 5.25,
      h: 6.3,
      sizing: { type: 'cover', w: 5.25, h: 6.3 },
    });
    s1.addShape('rect', {
      x: 7.55,
      y: 0.6,
      w: 5.25,
      h: 6.3,
      fill: { color: OBU_NAVY, transparency: 78 },
      line: { color: OBU_GOLD, width: 1.5 },
    });
    s1.addText('Chiro Main Campus  •  West Hararghe, Oromia', {
      x: 7.75,
      y: 6.35,
      w: 4.85,
      h: 0.35,
      fontFace: 'Calibri',
      fontSize: 11,
      bold: true,
      color: OBU_GOLD,
      align: 'center',
    });

    // Left Crest & Titles
    s1.addImage({ path: LOGO_PATH, x: 0.65, y: 0.75, w: 1.15, h: 1.15 });
    s1.addText('ODA BULTUM UNIVERSITY', {
      x: 1.98,
      y: 0.85,
      w: 5.3,
      h: 0.4,
      fontFace: 'Georgia',
      fontSize: 20,
      bold: true,
      color: 'FFFFFF',
    });
    s1.addText('"Productive Mind for Development"', {
      x: 1.98,
      y: 1.25,
      w: 5.3,
      h: 0.3,
      fontFace: 'Georgia',
      italic: true,
      fontSize: 13,
      color: OBU_GOLD,
    });

    s1.addShape('rect', {
      x: 0.65,
      y: 2.2,
      w: 2.4,
      h: 0.06,
      fill: { color: OBU_GOLD },
      line: { type: 'none' },
    });

    s1.addText('PROJECT DEFENCE PRESENTATION', {
      x: 0.65,
      y: 2.45,
      w: 6.5,
      h: 0.35,
      fontFace: 'Calibri',
      fontSize: 12,
      bold: true,
      color: OBU_GOLD,
    });

    s1.addText('Official Per Diem &\nTravel Authorization\nManagement System', {
      x: 0.65,
      y: 2.9,
      w: 6.6,
      h: 2.1,
      fontFace: 'Georgia',
      fontSize: 32,
      bold: true,
      color: 'FFFFFF',
      valign: 'top',
    });

    s1.addText(
      'Cloud-Synchronized Multi-Role Web Platform for Standardized ETB Per Diem Computation, Administrative Review, and Treasury Voucher Disbursement.',
      {
        x: 0.65,
        y: 5.15,
        w: 6.5,
        h: 0.9,
        fontFace: 'Calibri',
        fontSize: 13,
        color: 'CBD5E1',
      }
    );

    s1.addText('Directorate of Finance & Academic Administration  |  November 2026', {
      x: 0.65,
      y: 6.45,
      w: 6.5,
      h: 0.3,
      fontFace: 'Calibri',
      fontSize: 11,
      color: OBU_GOLD,
    });
  }

  // SLIDE 2: BACKGROUND & PROBLEM STATEMENT
  {
    const s2 = pptx.addSlide();
    addSlideChrome(
      s2,
      'Institutional Context & Problem Statement',
      'Why Oda Bultum University Needed a Digital Cloud Per Diem Platform',
      2,
      TOTAL
    );

    addCard(
      s2,
      0.55,
      1.45,
      5.95,
      5.3,
      'Legacy Paper Workflow Challenges',
      [
        'Manual rate lookup caused frequent arithmetic mistakes across subsistence, lodging, and living-index tiers.',
        'Physical paper routing between Colleges, Deans, VPs, and Finance delayed urgent academic travel clearances.',
        'Zero real-time visibility: employees could not track claim status without visiting administrative offices.',
        'Isolated local spreadsheets created audit gaps and inconsistent payment voucher numbering.',
        'No centralized verification gate for newly onboarded academic and administrative employees.',
      ],
      'B91C1C'
    );

    addCard(
      s2,
      6.83,
      1.45,
      5.95,
      5.3,
      'Proposed Digital Solution Impact',
      [
        'Automated ETB Per Diem Engine enforces OBU allowances deterministically at submission time.',
        'Three-role digital routing (Employee -> Administrator -> Finance Directorate) removes physical bottlenecks.',
        'Shared Cloud Firestore database syncs registrations, approvals, and claims across campus devices in real time.',
        'Standardized OBU-FIN-08 Payment Vouchers & OBU-FIN-RPT reports preserve clean treasury audit trails.',
        'Zero-Trust security rules protect staff PII and lock disbursed vouchers from post-payment tampering.',
      ],
      OBU_GOLD_DARK
    );
  }

  // SLIDE 3: OBJECTIVES & SCOPE
  {
    const s3 = pptx.addSlide();
    addSlideChrome(
      s3,
      'Project Objectives & Institutional Scope',
      'Core Functional and Security Mandates Delivered',
      3,
      TOTAL
    );

    addCard(
      s3,
      0.55,
      1.45,
      12.23,
      1.45,
      'General Objective',
      [
        'Design, secure, and deploy a cloud-enabled Per Diem & Travel Authorization Management System tailored to Oda Bultum University financial governance, enabling accurate computation, transparent approvals, and verifiable voucher issuance across any internet-connected device.',
      ],
      OBU_GOLD
    );

    addCard(
      s3,
      0.55,
      3.15,
      3.85,
      3.6,
      '1. Identity & Governance',
      [
        'Employee self-registration locked to Pending Approval status.',
        'Administrator authorization required before portal login.',
        'Admin-provisioned invitations for Finance & Admin officers.',
      ],
      OBU_NAVY
    );

    addCard(
      s3,
      4.74,
      3.15,
      3.85,
      3.6,
      '2. Policy Automation',
      [
        'Auto-calculates daily subsistence, lodging & incidentals in ETB.',
        'Applies Federal Capital (1.25x) and Remote Woreda (1.15x) indices.',
        'Eliminates manual voucher arithmetic corrections.',
      ],
      OBU_NAVY
    );

    addCard(
      s3,
      8.93,
      3.15,
      3.85,
      3.6,
      '3. Treasury & Cloud Sync',
      [
        'Supports CBE Transfer, Telebirr, Cheque & Cash disbursements.',
        'Prints official OBU-FIN-08 & OBU-FIN-RPT documents.',
        'Real-time Firestore sync across Netlify & mobile/desktop clients.',
      ],
      OBU_NAVY
    );
  }

  // SLIDE 4: END-TO-END WORKFLOW LIFECYCLE
  {
    const s4 = pptx.addSlide();
    addSlideChrome(
      s4,
      'Three-Stage Approval & Disbursement Lifecycle',
      'Enforced Institutional Accountability from Submission to Payment Voucher',
      4,
      TOTAL
    );

    addCard(
      s4,
      0.55,
      1.5,
      3.7,
      4.15,
      'Stage 1: Employee Portal',
      [
        'Authorized staff enters destination, dates, purpose & transport mode.',
        'System computes live ETB breakdown automatically.',
        'Submits claim with status SUBMITTED_FOR_APPROVAL.',
        'Unique tracking ID generated (e.g., OBU-TR-2026-0041).',
      ],
      OBU_NAVY
    );

    s4.addText('→', {
      x: 4.3,
      y: 3.1,
      w: 0.55,
      h: 0.6,
      fontSize: 32,
      bold: true,
      color: OBU_GOLD_DARK,
      align: 'center',
    });

    addCard(
      s4,
      4.82,
      1.5,
      3.7,
      4.15,
      'Stage 2: Administrator Console',
      [
        'Reviews pending claims alongside destination & total ETB.',
        'Approves (APPROVED_BY_ADMIN) -> routes to Finance.',
        'Or rejects (REJECTED_BY_ADMIN) with remarks -> returns to Employee.',
        'Authorizes new employee registrations & provisions officers.',
      ],
      OBU_GOLD_DARK
    );

    s4.addText('→', {
      x: 8.56,
      y: 3.1,
      w: 0.55,
      h: 0.6,
      fontSize: 32,
      bold: true,
      color: OBU_GOLD_DARK,
      align: 'center',
    });

    addCard(
      s4,
      9.08,
      1.5,
      3.7,
      4.15,
      'Stage 3: Finance Directorate',
      [
        'Sees Admin-approved queue ready for payout.',
        'Disburses via CBE Bank, Telebirr, Cheque, or Cash.',
        'Records transaction reference & generates OBU-FIN-PV voucher.',
        'Transitions claim to immutable COMPLETED state.',
      ],
      '047857'
    );

    s4.addShape('roundRect', {
      x: 0.55,
      y: 5.9,
      w: 12.23,
      h: 0.9,
      rectRadius: 0.06,
      fill: { color: OBU_NAVY },
      line: { color: OBU_GOLD, width: 1 },
    });
    s4.addText(
      'State Machine Invariant: Claims cannot skip Administrator approval to reach Finance disbursement, and COMPLETED vouchers are permanently locked against non-admin alteration.',
      {
        x: 0.8,
        y: 6.03,
        w: 11.7,
        h: 0.65,
        fontFace: 'Calibri',
        fontSize: 13,
        bold: true,
        color: 'FFFFFF',
        valign: 'middle',
      }
    );
  }

  // SLIDE 5: STANDARDIZED PER DIEM ENGINE
  {
    const s5 = pptx.addSlide();
    addSlideChrome(
      s5,
      'Automated ETB Per Diem Calculation Engine',
      'Deterministic Rate Matrix Implemented in src/utils/perDiemCalculator.ts',
      5,
      TOTAL
    );

    s5.addTable(
      [
        [
          { text: 'Staff Tier', options: { bold: true, color: 'FFFFFF', fill: { color: OBU_NAVY } } },
          { text: 'Meal / Day', options: { bold: true, color: 'FFFFFF', fill: { color: OBU_NAVY } } },
          { text: 'Lodging / Day', options: { bold: true, color: 'FFFFFF', fill: { color: OBU_NAVY } } },
          { text: 'Regional (1.0x)', options: { bold: true, color: 'FFFFFF', fill: { color: OBU_NAVY } } },
          { text: 'Addis Ababa (1.25x)', options: { bold: true, color: 'FFFFFF', fill: { color: OBU_NAVY } } },
          { text: 'Remote Woreda (1.15x)', options: { bold: true, color: 'FFFFFF', fill: { color: OBU_NAVY } } },
        ],
        [
          { text: 'Senior Academic / Dean' },
          { text: '1,200 ETB' },
          { text: '1,800 ETB' },
          { text: '3,000 ETB' },
          { text: '3,750 ETB' },
          { text: '3,450 ETB' },
        ],
        [
          { text: 'Lecturer / Researcher' },
          { text: '900 ETB' },
          { text: '1,400 ETB' },
          { text: '2,300 ETB' },
          { text: '2,875 ETB' },
          { text: '2,645 ETB' },
        ],
        [
          { text: 'Admin & Support Staff' },
          { text: '600 ETB' },
          { text: '1,000 ETB' },
          { text: '1,600 ETB' },
          { text: '2,000 ETB' },
          { text: '1,840 ETB' },
        ],
      ],
      {
        x: 0.55,
        y: 1.45,
        w: 12.23,
        h: 2.35,
        fontFace: 'Calibri',
        fontSize: 12.5,
        border: { pt: 0.75, color: BORDER_LIGHT },
        fill: { color: 'FFFFFF' },
        valign: 'middle',
      }
    );

    addCard(
      s5,
      0.55,
      4.05,
      5.95,
      2.75,
      'Transport & Incidentals Schedule',
      [
        'University Fleet Vehicle: 0 ETB allowance (fuel via fleet voucher).',
        'Public Intercity Transport: 600 ETB fixed allowance.',
        'Domestic Flight: 350 ETB airport shuttle allowance.',
        'Personal Car Subsidy: 1,200 ETB fuel reimbursement.',
        'Daily Incidentals: 200 ETB × Number of Travel Days.',
      ],
      OBU_NAVY
    );

    addCard(
      s5,
      6.83,
      4.05,
      5.95,
      2.75,
      'Worked Sample (5-Day Addis Ababa Mission)',
      [
        'Staff Tier: Senior Academic (1,200 meal + 1,800 lodging).',
        'Capital Index (1.25x): (1,500 + 2,250) = 3,750 ETB/day.',
        '5 Days Subtotal: 3,750 × 5 = 18,750 ETB.',
        'Incidentals (200 × 5) + Public Transit (600) = 1,600 ETB.',
        'Grand Total Payable: 20,350 ETB (automatically computed).',
      ],
      OBU_GOLD_DARK
    );
  }

  // SLIDE 6: SYSTEM ARCHITECTURE
  {
    const s6 = pptx.addSlide();
    addSlideChrome(
      s6,
      'Cloud System Architecture',
      'Modern Full-Stack Web Architecture Built for High Availability',
      6,
      TOTAL
    );

    addCard(
      s6,
      0.55,
      1.5,
      3.85,
      5.25,
      'Presentation & UI Layer',
      [
        'React 19 + TypeScript SPA with strict compile-time typing.',
        'Vite 8 bundler with asset optimization and zero-latency routing.',
        'Tailwind CSS 4 responsive interface (mobile, tablet, desktop).',
        'Authentic OBU Navy (#101B35), White, and Gold (#D4AF37) design system.',
        'ErrorBoundary & Toast notifications for graceful feedback.',
      ],
      OBU_NAVY
    );

    addCard(
      s6,
      4.74,
      1.5,
      3.85,
      5.25,
      'Security & Business Logic',
      [
        'src/utils/perDiemCalculator.ts for deterministic ETB computation.',
        'src/utils/authSecurity.ts with SHA-256 Web Crypto credential hashing.',
        'src/services/firestoreService.ts validating payload bounds against blueprint.',
        'Firebase Auth (Google OAuth signInWithPopup) for verified identities.',
        'Structured handleFirestoreError() context telemetry.',
      ],
      OBU_GOLD_DARK
    );

    addCard(
      s6,
      8.93,
      1.5,
      3.85,
      5.25,
      'Cloud Database & Hosting',
      [
        'Cloud Firestore Enterprise Edition (corded-benefit-dcbh2).',
        'Real-time onSnapshot listeners pushing instant UI updates.',
        'Declarative Zero-Trust rules deployed to Google Cloud Firestore.',
        'GitHub -> Netlify CI/CD pipeline with netlify.toml & .npmrc.',
        'Print-ready CSS (@media print) for OBU-FIN-08 Payment Vouchers.',
      ],
      '047857'
    );
  }

  // SLIDE 7: FIRESTORE DATA MODEL
  {
    const s7 = pptx.addSlide();
    addSlideChrome(
      s7,
      'Cloud Database Schema Design',
      'Five Blueprint-Synchronized Firestore Collections (firebase-blueprint.json)',
      7,
      TOTAL
    );

    s7.addTable(
      [
        [
          { text: 'Collection', options: { bold: true, color: 'FFFFFF', fill: { color: OBU_NAVY } } },
          { text: 'Doc ID', options: { bold: true, color: 'FFFFFF', fill: { color: OBU_NAVY } } },
          { text: 'Key Fields & Governance Role', options: { bold: true, color: 'FFFFFF', fill: { color: OBU_NAVY } } },
          { text: 'Access Policy', options: { bold: true, color: 'FFFFFF', fill: { color: OBU_NAVY } } },
        ],
        [
          { text: '/staff_accounts' },
          { text: 'uid' },
          { text: 'uid, name, email, employeeId, phone, department, jobPosition, staffTier, role, accountStatus, passwordHash' },
          { text: 'Owner get/safe-update; Admin full review; self-reg locked to EMPLOYEE + PENDING_APPROVAL' },
        ],
        [
          { text: '/admins' },
          { text: 'uid' },
          { text: 'uid, email, grantedBy, createdAt' },
          { text: 'Trusted Admin lookup; created via bootstrap, invitation claim, or existing Admin' },
        ],
        [
          { text: '/finance_officers' },
          { text: 'uid' },
          { text: 'uid, email, grantedBy, createdAt' },
          { text: 'Trusted Finance lookup; created via active FINANCE invitation or Admin' },
        ],
        [
          { text: '/account_invitations' },
          { text: 'email' },
          { text: 'email, name, employeeId, department, jobPosition, role, status (ACTIVE | CLAIMED)' },
          { text: 'Admin create/list; target officer reads & atomically claims via writeBatch' },
        ],
        [
          { text: '/travel_requests' },
          { text: 'req_id' },
          { text: 'trackingCode, employeeUid, destination, daysCount, breakdown{}, status, approval{}, payment{}' },
          { text: 'Employee scoped query (where employeeUid == uid); Admin/Finance workflow transitions' },
        ],
      ],
      {
        x: 0.55,
        y: 1.45,
        w: 12.23,
        h: 5.2,
        fontFace: 'Calibri',
        fontSize: 12,
        border: { pt: 0.75, color: BORDER_LIGHT },
        fill: { color: 'FFFFFF' },
        valign: 'middle',
      }
    );
  }

  // SLIDE 8: ROLE-BASED PORTALS & VOUCHERS
  {
    const s8 = pptx.addSlide();
    addSlideChrome(
      s8,
      'Implemented User Portals & Formal Vouchers',
      'Clean, Production-Grade Institutional Experience Across All Roles',
      8,
      TOTAL
    );

    addCard(
      s8,
      0.55,
      1.45,
      5.95,
      2.55,
      'Welcome, Registration & Role Login Gateways',
      [
        'Official OBU Welcome Portal showcasing motto, rate policy & Chiro campus.',
        '8-field Employee Registration synced straight to Cloud Firestore.',
        '3-tab Role Login (Employee, Administrator, Finance) with Google Sign-In, Remember Me, and Cloud Password Recovery.',
      ],
      OBU_NAVY
    );

    addCard(
      s8,
      6.83,
      1.45,
      5.95,
      2.55,
      'Employee Dashboard',
      [
        'Scoped live claim ledger filtered strictly to authenticated user UID.',
        'Interactive Travel Authorization & Per Diem Calculator modal.',
        'Real-time status tracking (Awaiting Admin -> In Finance -> Paid) + Revise/View Voucher actions.',
      ],
      OBU_GOLD_DARK
    );

    addCard(
      s8,
      0.55,
      4.25,
      5.95,
      2.55,
      'Administrator Console',
      [
        'Top alert banner & dedicated Account Authorizations tab for new employee approvals.',
        'Approve -> Finance or Reject -> Employee decision workflow with remarks audit log.',
        'Provision Admin / Finance modal creating instant cloud invitations.',
      ],
      OBU_GOLD_DARK
    );

    addCard(
      s8,
      6.83,
      4.25,
      5.95,
      2.55,
      'Finance Desk & Official Vouchers',
      [
        'KPI metrics for pending payout queue and cumulative ETB disbursed.',
        'Disbursement modal capturing CBE/Telebirr/Cheque/Cash ref numbers.',
        'Print-ready OBU-FIN-08 Payment Voucher and OBU-FIN-RPT Institutional Summary Report.',
      ],
      '047857'
    );
  }

  // SLIDE 9: ZERO-TRUST SECURITY ARCHITECTURE
  {
    const s9 = pptx.addSlide();
    addSlideChrome(
      s9,
      'Zero-Trust Security Engineering',
      'Hardened Firestore Security Rules & Adversarial Red Team Mitigation',
      9,
      TOTAL
    );

    addCard(
      s9,
      0.55,
      1.5,
      6.0,
      5.25,
      'Core Security Guarantees Enforced',
      [
        'Default-Deny Safety Net: Unmatched paths rejected automatically.',
        'Verified Identity Mandate: Every operation requires verified Google email token (email_verified == true).',
        'PII Isolation: Staff emails, phones, and password hashes readable strictly by Owner or Administrator.',
        'No Self-Assigned Roles: Public registration forced to EMPLOYEE + PENDING_APPROVAL; Owner cannot alter role or accountStatus.',
        'Immutable Audit Trail: createdAt == request.time, updatedAt == request.time, and employeeUid immutable post-creation.',
      ],
      OBU_NAVY
    );

    addCard(
      s9,
      6.8,
      1.5,
      5.98,
      5.25,
      'The "Dirty Dozen" Attack Vectors Blocked',
      [
        'Unauthenticated Reads & Unverified Email Writes -> DENIED.',
        'Self-Assigned Admin Role or Self-Activated Registration -> DENIED.',
        'Shadow Ghost Fields (e.g., isVerified: true) -> Blocked via keys().hasOnly() & affectedKeys().hasOnly().',
        'Identity Spoofing & State Shortcutting on Claims -> DENIED.',
        'Employee Self-Approval & Post-Disbursement Voucher Edits -> DENIED.',
        'Cross-Employee PII List Scraping & 1MB Resource/ID Poisoning -> Blocked by list query scoping & .size() caps.',
      ],
      'B91C1C'
    );
  }

  // SLIDE 10: CLOUD DEPLOYMENT & MULTI-DEVICE SYNC
  {
    const s10 = pptx.addSlide();
    addSlideChrome(
      s10,
      'Multi-Device Cloud Sync & Production Deployment',
      'Seamless Operation Across Local, AI Studio Preview, GitHub, and Netlify',
      10,
      TOTAL
    );

    addCard(
      s10,
      0.55,
      1.5,
      5.95,
      5.25,
      'Why Cloud Sync Replaced Local Browser Storage',
      [
        'Previously, browser localStorage isolated new registrations to a single device.',
        'Now, registering on an employee phone writes immediately to Cloud Firestore.',
        'Administrator laptops see new pending employees instantaneously via onSnapshot.',
        'Admin/Finance invitations created in Chiro activate on any officer browser via atomic writeBatch claim.',
      ],
      OBU_GOLD_DARK
    );

    addCard(
      s10,
      6.83,
      1.5,
      5.95,
      5.25,
      'Netlify & CI/CD Engineering Fixes',
      [
        'Added .npmrc (legacy-peer-deps=true) eliminating Vite 8 / esbuild ERESOLVE CI install failures.',
        'Added netlify.toml pinning Node 22, build command (npm run build), dist output, and SPA fallback redirects.',
        'Converted bundled avatar assets to ES imports for hash-safe Vite production bundling.',
        'Configured Firebase Authorized Domains checklist for Google Sign-In on custom Netlify hostnames.',
      ],
      OBU_NAVY
    );
  }

  // SLIDE 11: VERIFICATION & TESTING
  {
    const s11 = pptx.addSlide();
    addSlideChrome(
      s11,
      'Testing, Static Verification & Quality Assurance',
      'Comprehensive Build, Type, Security Lint & Workflow Validation',
      11,
      TOTAL
    );

    s11.addTable(
      [
        [
          { text: 'Verification Suite', options: { bold: true, color: 'FFFFFF', fill: { color: OBU_NAVY } } },
          { text: 'Command / Tool Used', options: { bold: true, color: 'FFFFFF', fill: { color: OBU_NAVY } } },
          { text: 'Result & Coverage', options: { bold: true, color: 'FFFFFF', fill: { color: OBU_NAVY } } },
        ],
        [
          { text: 'TypeScript Type Check' },
          { text: 'npm run lint (tsc --noEmit)' },
          { text: 'PASSED — 0 type or import errors across all portals & Firestore services.' },
        ],
        [
          { text: 'Production Bundle' },
          { text: 'npm run build (vite build)' },
          { text: 'PASSED — Clean production bundle built in ~1.0s with ES assets & icons.' },
        ],
        [
          { text: 'Firestore Rules Linter' },
          { text: 'npx eslint firestore.rules' },
          { text: 'PASSED — 0 syntax or open-access issues via @firebase/eslint-plugin-security-rules.' },
        ],
        [
          { text: 'Cloud Rules Deployment' },
          { text: 'Firebase ProvisionFirebase & DeployRules' },
          { text: 'DEPLOYED LIVE — Enforced on Firestore instance for corded-benefit-dcbh2.' },
        ],
        [
          { text: 'Red Team Spec Audit' },
          { text: 'security_spec.md (12 Attack Vectors)' },
          { text: 'VERIFIED — All 12 privilege, PII, state-skip & injection payloads blocked.' },
        ],
      ],
      {
        x: 0.55,
        y: 1.5,
        w: 12.23,
        h: 4.95,
        fontFace: 'Calibri',
        fontSize: 13,
        border: { pt: 0.75, color: BORDER_LIGHT },
        fill: { color: 'FFFFFF' },
        valign: 'middle',
      }
    );
  }

  // SLIDE 12: CONCLUSION & Q&A
  {
    const s12 = pptx.addSlide();
    s12.background = { color: OBU_NAVY };

    s12.addImage({
      path: CAMPUS_4_PATH,
      x: 0.65,
      y: 0.85,
      w: 5.5,
      h: 4.1,
      sizing: { type: 'cover', w: 5.5, h: 4.1 },
    });
    s12.addImage({
      path: CAMPUS_HERO_PATH,
      x: 0.65,
      y: 5.15,
      w: 5.5,
      h: 1.75,
      sizing: { type: 'cover', w: 5.5, h: 1.75 },
    });

    s12.addImage({ path: LOGO_PATH, x: 6.65, y: 0.8, w: 0.95, h: 0.95 });
    s12.addText('ODA BULTUM UNIVERSITY', {
      x: 7.75,
      y: 0.9,
      w: 5.0,
      h: 0.35,
      fontFace: 'Georgia',
      fontSize: 18,
      bold: true,
      color: 'FFFFFF',
    });
    s12.addText('"Productive Mind for Development"', {
      x: 7.75,
      y: 1.25,
      w: 5.0,
      h: 0.3,
      fontFace: 'Georgia',
      italic: true,
      fontSize: 12,
      color: OBU_GOLD,
    });

    s12.addText('Conclusion & Future Roadmap', {
      x: 6.65,
      y: 2.0,
      w: 6.1,
      h: 0.5,
      fontFace: 'Georgia',
      fontSize: 26,
      bold: true,
      color: OBU_GOLD,
    });

    s12.addText(
      [
        {
          text: 'Accurate, transparent, and tamper-resistant digital per diem governance for Oda Bultum University.',
          options: { bullet: { code: '2713' }, paraSpaceAfter: 10 },
        },
        {
          text: 'Real-time cloud synchronization connecting Employees, Administrators, and Finance Directorate across devices.',
          options: { bullet: { code: '2713' }, paraSpaceAfter: 10 },
        },
        {
          text: 'Future Roadmap: HR/ERP payroll integration, SMS/email claim alerts, and automated CBE/Telebirr bank webhook reconciliation.',
          options: { bullet: { code: '2713' }, paraSpaceAfter: 16 },
        },
      ],
      {
        x: 6.65,
        y: 2.65,
        w: 6.1,
        h: 2.7,
        fontFace: 'Calibri',
        fontSize: 13.5,
        color: 'E2E8F0',
        valign: 'top',
      }
    );

    s12.addShape('roundRect', {
      x: 6.65,
      y: 5.45,
      w: 6.1,
      h: 1.45,
      rectRadius: 0.08,
      fill: { color: '1A2B52' },
      line: { color: OBU_GOLD, width: 1.2 },
    });
    s12.addText('Thank You  •  Questions & Live System Demonstration', {
      x: 6.85,
      y: 5.65,
      w: 5.7,
      h: 0.45,
      fontFace: 'Georgia',
      fontSize: 18,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    });
    s12.addText('Chiro, West Hararghe, Oromia  |  obu.edu.et  |  OBU Finance Directorate', {
      x: 6.85,
      y: 6.22,
      w: 5.7,
      h: 0.35,
      fontFace: 'Calibri',
      fontSize: 11.5,
      color: OBU_GOLD,
      align: 'center',
    });
  }

  const outPath = path.join(OUT_DIR, 'OBU_Per_Diem_Defence_Presentation.pptx');
  await pptx.writeFile({ fileName: outPath });
  return outPath;
}

async function main() {
  const docxPath = await buildDefenceReportDocx();
  const pptxPath = await buildDefencePresentationPptx();
  console.log('Generated Defence Report:', docxPath);
  console.log('Generated Defence Presentation:', pptxPath);
}

main().catch((err) => {
  console.error('Failed to generate defence documents:', err);
  process.exit(1);
});
