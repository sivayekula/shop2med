/*
# Medical Store Backend - Setup & Usage

## Installation

```bash
npm install
```

## Environment Setup

Create `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/medical-store
PORT=3000
JWT_SECRET=your-secret-key-here
```

## Database Import

### Step 1: Parse NPPA PDF

First, run the Python parser to convert NPPA PDF to JSON:

```bash
python nppa_parser.py
```

This creates `medicines_seed.json` in your project root.

### Step 2: Import to MongoDB

Place `medicines_seed.json` in `data/` folder, then run:

```bash
npm run import:nppa
```

This will import all 856 medicines from NPPA data.

### Step 3 (Optional): Seed Sample Data

For testing with sample medicines:

```bash
npm run seed
```

## Running the Application

Development mode:
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

## API Endpoints

Base URL: `http://localhost:3000/api`

### Medicine Endpoints

- `POST /medicines` - Create new medicine
- `POST /medicines/find-or-create` - Smart entry (find existing or create new)
- `GET /medicines` - Get all medicines (paginated)
- `GET /medicines/search?query=para` - Search medicines
- `GET /medicines/autocomplete?q=par` - Autocomplete for name entry
- `GET /medicines/popular` - Get popular medicines
- `GET /medicines/categories` - Get all categories
- `GET /medicines/category/:category` - Get medicines by category
- `GET /medicines/:id` - Get medicine by ID
- `PATCH /medicines/:id` - Update medicine
- `DELETE /medicines/:id` - Soft delete medicine
- `POST /medicines/:id/record-usage` - Record sale (increases usage count)

### Example Requests

**Create Medicine:**
```bash
curl -X POST http://localhost:3000/medicines \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dolo 650",
    "genericName": "Paracetamol",
    "dosageForm": "Tablet",
    "strength": "650 mg",
    "mrp": 2.5,
    "purchasePrice": 2.0,
    "manufacturer": "Micro Labs",
    "category": "Analgesic"
  }'
```

**Search Medicines:**
```bash
curl "http://localhost:3000/medicines/search?query=paracetamol&category=Analgesic&page=1&limit=20"
```

**Autocomplete:**
```bash
curl "http://localhost:3000/medicines/autocomplete?q=para"
```

## Swagger Documentation

Access API documentation at:
```
http://localhost:3000/api-docs
```

## Project Structure

```
src/
├── medicines/
│   ├── dto/
│   │   ├── create-medicine.dto.ts
│   │   ├── update-medicine.dto.ts
│   │   └── search-medicine.dto.ts
│   ├── schemas/
│   │   └── medicine.schema.ts
│   ├── medicines.controller.ts
│   ├── medicines.service.ts
│   └── medicines.module.ts
├── scripts/
│   ├── import-nppa.ts
│   └── seed-database.ts
├── app.module.ts
└── main.ts
```