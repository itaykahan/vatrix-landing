# VATrix Scan Page

Production-quality "Upload & Scan" page for VAT receipt analysis, built with Next.js 14.

## Features

- **Company Details Form**: Capture company name, country of establishment, VAT ID, and email
- **Multi-file Upload**: Drag-and-drop or browse for PDF, JPG, PNG, HEIC files (max 15MB each)
- **Processing Queue**: Visual status tracking with progress indicators
- **End-to-End Pipeline**:
  - System 1 (calculate-vat): OCR extraction from receipts
  - System 2 (rebbi): EU 8th Directive eligibility rules engine
- **Results Display**: Per-receipt cards showing eligibility, amounts, reasoning, and rule details
- **Export**: Download results as JSON or CSV

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Supabase Edge Functions
- CSS-in-JS (styled-jsx)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://vvnlcytnivniqzaviluz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000/scan](http://localhost:3000/scan)

## Project Structure

```
vatrix-scan/
├── app/
│   ├── layout.tsx       # Root layout with fonts
│   ├── globals.css      # Global styles
│   ├── page.tsx         # Landing page (with CTAs → /scan)
│   └── scan/
│       └── page.tsx     # Main scan page
├── components/
│   ├── UploadDropzone.tsx      # Drag-and-drop upload
│   ├── ReceiptQueueItem.tsx    # Queue item with status
│   ├── ResultCard.tsx          # Result display card
│   ├── SummaryBar.tsx          # Summary statistics
│   └── index.ts                # Component exports
├── lib/
│   ├── supabase.ts      # Supabase client + Edge Function helpers
│   └── vat-service.ts   # Processing pipeline + validation
└── package.json
```

## Edge Function Integration

### System 1: calculate-vat (OCR)

**Endpoint**: `https://vvnlcytnivniqzaviluz.supabase.co/functions/v1/calculate-vat`

**Request**:
```json
{
  "file": {
    "name": "receipt.pdf",
    "type": "application/pdf",
    "data": "base64_encoded_data..."
  },
  "company": {
    "name": "Company Name",
    "country": "IL",
    "vat_id": "123456789"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "vendor_name": "Vendor Ltd",
    "vendor_vat": "CY12345678",
    "invoice_date": "2024-01-15",
    "total_amount": 100.00,
    "net_amount": 83.33,
    "vat_amount": 16.67,
    "vat_rate": 0.19,
    "currency": "EUR",
    "country": "CY",
    "confidence": 0.95
  }
}
```

### System 2: rebbi (Rules Engine)

**Endpoint**: `https://vvnlcytnivniqzaviluz.supabase.co/functions/v1/rebbi`

**Request**:
```json
{
  "extraction": { /* System 1 output */ },
  "company": {
    "name": "Company Name",
    "country": "IL",
    "vat_id": "123456789"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "eligibility": "approved",
    "refundable_amount": 16.67,
    "reasoning": "Receipt meets all EU 8th Directive requirements...",
    "rule_hits": [
      {
        "code": "CY-001",
        "title": "Valid VAT Registration",
        "passed": true,
        "severity": "blocker",
        "message": "Vendor VAT number verified"
      }
    ],
    "confidence": 0.92
  }
}
```

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Remember to add environment variables in Vercel project settings.

## Design System

Matches the existing VATrix landing page:
- **Colors**: `#00d4ff` (cyan), `#7b61ff` (purple), `#ff6b9d` (pink), `#00ff88` (green)
- **Typography**: Inter (body), Outfit (headings), JetBrains Mono (numbers/code)
- **Effects**: Aurora gradients, glassmorphism, animated orbs
