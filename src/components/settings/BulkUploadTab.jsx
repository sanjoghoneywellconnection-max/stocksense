import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabaseClient'
import {
  Download, Upload, CheckCircle, AlertTriangle,
  XCircle, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react'

const REQUIRED_COLS = [
  'SKU Code', 'Item Name', 'MRP', 'Cost Price',
  'Selling Price', 'Lead Time Days'
]

const OPTIONAL_COLS = [
  'Variant', 'Brand', 'Category', 'Parent ASIN',
  'Child ASIN', 'HSN Code', 'Lead Time Type',
  'Vendor Name', 'MOQ', 'Opening Date'
]

const LEAD_TIME_TYPES = ['procurement', 'manufacturing']

export default function BulkUploadTab({ orgId }) {
  const [step, setStep] = useState(1) // 1=download, 2=upload, 3=preview, 4=done
  const [warehouses, setWarehouses] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [existingSkuCodes, setExistingSkuCodes] = useState([])
  const [parsedRows, setParsedRows] = useState([])
  const [validatedRows, setValidatedRows] = useState([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const fileRef = useRef()

  useEffect(() => { fetchMasterData() }, [orgId])

  async function fetchMasterData() {
    const [whRes, catRes, brandRes, skuRes] = await Promise.all([
      supabase.from('warehouses').select('id, name').eq('org_id', orgId).eq('is_active', true).order('name'),
      supabase.from('categories').select('id, name').eq('org_id', orgId).order('name'),
      supabase.from('brands_master').select('id, name').eq('org_id', orgId).order('name'),
      supabase.from('skus').select('sku_code').eq('org_id', orgId).eq('status', 'active'),
    ])
    setWarehouses(whRes.data || [])
    setCategories(catRes.data || [])
    setBrands(brandRes.data || [])
    setExistingSkuCodes((skuRes.data || []).map(s => s.sku_code?.toLowerCase()))
  }

  // ─── STEP 1: Generate & download template ───────────────────────────────────

  function downloadTemplate() {
    const warehouseCols = warehouses.map(w => w.name)
    const headers = [
      'SKU Code*', 'Item Name*', 'Variant',
      'Brand', 'Category',
      'Parent ASIN', 'Child ASIN', 'HSN Code',
      'MRP*', 'Cost Price*', 'Selling Price*',
      'Lead Time Days*', 'Lead Time Type',
      'Vendor Name', 'MOQ', 'Opening Date*',
      ...warehouseCols.map(w => `Stock: ${w}`)
    ]

    const exampleRow = [
      'SKU-001', 'Vitamin C Face Serum', '30ml',
      'Wozoyo', 'Skincare',
      'B08XYZ', 'B08ABC', '3304',
      '999', '250', '799',
      '15', 'procurement',
      'ABC Pharma Pvt Ltd', '100',
      new Date().toISOString().split('T')[0],
      ...warehouseCols.map(() => '500')
    ]

    const notes = [
      '# INSTRUCTIONS:',
      '# 1. Do not change column headers',
      '# 2. Fields marked with * are required',
      '# 3. Lead Time Type must be: procurement OR manufacturing',
      '# 4. Opening Date format: YYYY-MM-DD',
      `# 5. Your warehouses: ${warehouseCols.join(', ')}`,
      '# 6. Delete this notes section before uploading',
      '',
    ]

    const csvContent = [
      ...notes,
      headers.join(','),
      exampleRow.join(','),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventsight_sku_template_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    setStep(2)
  }

  // ─── STEP 2: Parse uploaded CSV ──────────────────────────────────────────────

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target.result
      const rows = parseCSV(text)
      if (rows.length === 0) {
        alert('No data found in file. Make sure you have rows below the header.')
        return
      }
      setParsedRows(rows)
      validateRows(rows)
      setStep(3)
    }
    reader.readAsText(file)
  }

  function parseCSV(text) {
    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('//'))

    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/\*$/, ''))
    const rows = []

    for (let i = 1; i < lines.length; i++) {
      const values = splitCSVLine(lines[i])
      if (values.every(v => !v.trim())) continue // skip empty rows

      const row = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx]?.trim() || ''
      })
      row._rowNum = i + 1
      rows.push(row)
    }

    return rows
  }

  function splitCSVLine(line) {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes
      } else if (line[i] === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += line[i]
      }
    }
    result.push(current)
    return result
  }

  // ─── STEP 3: Validate rows ───────────────────────────────────────────────────

  function validateRows(rows) {
    const warehouseCols = warehouses.map(w => ({ id: w.id, name: w.name, col: `Stock: ${w.name}` }))

    const validated = rows.map(row => {
      const errors = []
      const warnings = []

      // Required fields
      if (!row['SKU Code']?.trim()) errors.push('SKU Code is required')
      if (!row['Item Name']?.trim()) errors.push('Item Name is required')
      if (!row['MRP']?.trim() || isNaN(parseFloat(row['MRP']))) errors.push('MRP must be a number')
      if (!row['Cost Price']?.trim() || isNaN(parseFloat(row['Cost Price']))) errors.push('Cost Price must be a number')
      if (!row['Selling Price']?.trim() || isNaN(parseFloat(row['Selling Price']))) errors.push('Selling Price must be a number')
      if (!row['Lead Time Days']?.trim() || isNaN(parseInt(row['Lead Time Days']))) errors.push('Lead Time Days must be a number')
      if (!row['Opening Date']?.trim()) errors.push('Opening Date is required')
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(row['Opening Date']?.trim())) errors.push('Opening Date must be YYYY-MM-DD format')

      // Lead time type
      const ltt = row['Lead Time Type']?.trim().toLowerCase()
      if (ltt && !LEAD_TIME_TYPES.includes(ltt)) {
        errors.push(`Lead Time Type must be "procurement" or "manufacturing"`)
      }

      // MOQ
      if (row['MOQ']?.trim() && isNaN(parseInt(row['MOQ']))) {
        errors.push('MOQ must be a number')
      }

      // Duplicate SKU code
      if (row['SKU Code']?.trim() && existingSkuCodes.includes(row['SKU Code'].trim().toLowerCase())) {
        warnings.push(`SKU Code "${row['SKU Code']}" already exists — will be skipped`)
      }

      // Brand match
      const brandName = row['Brand']?.trim()
      const brandMatch = brandName
        ? brands.find(b => b.name.toLowerCase() === brandName.toLowerCase())
        : null
      if (brandName && !brandMatch) warnings.push(`Brand "${brandName}" not found — will be created`)

      // Category match
      const categoryName = row['Category']?.trim()
      const categoryMatch = categoryName
        ? categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
        : null
      if (categoryName && !categoryMatch) warnings.push(`Category "${categoryName}" not found — will be created`)

      // Stock values
      const stockEntries = warehouseCols.map(wh => ({
        warehouse_id: wh.id,
        warehouse_name: wh.name,
        qty: parseInt(row[wh.col]) || 0,
      }))

      const hasAnyStock = stockEntries.some(s => s.qty > 0)
      if (!hasAnyStock) warnings.push('No opening stock entered — SKU will be added with 0 stock')

      const status = errors.length > 0 ? 'error'
        : warnings.some(w => w.includes('already exists')) ? 'duplicate'
        : warnings.length > 0 ? 'warning'
        : 'valid'

      return {
        ...row,
        _errors: errors,
        _warnings: warnings,
        _status: status,
        _brandMatch: brandMatch,
        _categoryMatch: categoryMatch,
        _stockEntries: stockEntries,
      }
    })

    setValidatedRows(validated)
  }

  // ─── STEP 4: Import ──────────────────────────────────────────────────────────

  async function handleImport() {
    setImporting(true)

    const toImport = validatedRows.filter(r => r._status !== 'error' && r._status !== 'duplicate')
    let imported = 0
    let failed = 0
    const failedRows = []

    for (const row of toImport) {
      try {
        // Resolve or create brand
        let brandId = row._brandMatch?.id || null
        if (row['Brand']?.trim() && !brandId) {
          const { data: newBrand } = await supabase
            .from('brands_master')
            .insert({ org_id: orgId, name: row['Brand'].trim() })
            .select().single()
          brandId = newBrand?.id || null
        }

        // Resolve or create category
        let categoryId = row._categoryMatch?.id || null
        if (row['Category']?.trim() && !categoryId) {
          const { data: newCat } = await supabase
            .from('categories')
            .insert({ org_id: orgId, name: row['Category'].trim() })
            .select().single()
          categoryId = newCat?.id || null
        }

        // Insert SKU
        const { data: sku, error: skuErr } = await supabase
          .from('skus')
          .insert({
            org_id: orgId,
            sku_code: row['SKU Code'].trim(),
            item_name: row['Item Name'].trim(),
            variant_name: row['Variant']?.trim() || null,
            parent_asin: row['Parent ASIN']?.trim() || null,
            child_asin: row['Child ASIN']?.trim() || null,
            hsn_code: row['HSN Code']?.trim() || null,
            brand_id: brandId,
            category_id: categoryId,
            mrp: parseFloat(row['MRP']),
            cost_price: parseFloat(row['Cost Price']),
            selling_price: parseFloat(row['Selling Price']),
            lead_time_days: parseInt(row['Lead Time Days']),
            lead_time_type: row['Lead Time Type']?.trim().toLowerCase() || 'procurement',
            vendor_name: row['Vendor Name']?.trim() || null,
            minimum_order_qty: parseInt(row['MOQ']) || 1,
            is_active: true,
            status: 'active',
          })
          .select().single()

        if (skuErr) throw skuErr

        // Insert stock for each warehouse
        const stockInserts = row._stockEntries
          .filter(s => s.qty > 0)
          .map(s => ({
            org_id: orgId,
            sku_id: sku.id,
            warehouse_id: s.warehouse_id,
            opening_qty: s.qty,
            opening_date: row['Opening Date'].trim(),
            current_qty: s.qty,
          }))

        if (stockInserts.length > 0) {
          await supabase.from('sku_warehouse_stock').insert(stockInserts)
        }

        imported++
      } catch (err) {
        failed++
        failedRows.push({ row: row['SKU Code'], error: err.message })
      }
    }

    const duplicates = validatedRows.filter(r => r._status === 'duplicate').length
    const errors = validatedRows.filter(r => r._status === 'error').length

    setImportResult({ imported, failed, duplicates, errors, failedRows })
    setImporting(false)
    setStep(4)
    await fetchMasterData()
  }

  // ─── Summary counts ──────────────────────────────────────────────────────────

  const validCount = validatedRows.filter(r => r._status === 'valid').length
  const warningCount = validatedRows.filter(r => r._status === 'warning').length
  const duplicateCount = validatedRows.filter(r => r._status === 'duplicate').length
  const errorCount = validatedRows.filter(r => r._status === 'error').length
  const importableCount = validCount + warningCount

  function reset() {
    setStep(1)
    setParsedRows([])
    setValidatedRows([])
    setImportResult(null)
    setExpandedRow(null)
    if (fileRef.current) fileRef.current.value = ''
    fetchMasterData()
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Progress steps */}
      <div className="bg-white rounded-2xl border p-5" style={{borderColor: '#e8e5f0'}}>
        <div className="flex items-center gap-0">
          {[
            { n: 1, label: 'Download Template' },
            { n: 2, label: 'Upload CSV' },
            { n: 3, label: 'Preview & Validate' },
            { n: 4, label: 'Done' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: step > s.n ? '#0f9b58' : step === s.n ? '#1e2b71' : '#e8e5f0',
                    color: step >= s.n ? 'white' : '#7880a4',
                  }}>
                  {step > s.n ? <CheckCircle size={16} /> : s.n}
                </div>
                <p className="text-xs mt-1 font-medium text-center"
                  style={{color: step === s.n ? '#1e2b71' : '#7880a4', whiteSpace: 'nowrap'}}>
                  {s.label}
                </p>
              </div>
              {i < 3 && (
                <div className="flex-1 h-0.5 mx-2 mb-4"
                  style={{background: step > s.n ? '#0f9b58' : '#e8e5f0'}} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 1: Download ── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border p-8" style={{borderColor: '#e8e5f0'}}>
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{background: '#f0f1fa'}}>
              <Download size={28} style={{color: '#1e2b71'}} />
            </div>
            <h2 className="text-xl font-bold text-navy mb-2">Download the SKU Template</h2>
            <p className="text-sm mb-6" style={{color: '#7880a4'}}>
              The template is pre-built with all required columns and your warehouse names already added.
              Fill in your SKU data and come back to upload.
            </p>

            {/* What's included */}
            <div className="rounded-2xl border p-5 mb-6 text-left space-y-2"
              style={{background: '#f8f7fc', borderColor: '#e8e5f0'}}>
              <p className="text-xs font-bold text-navy uppercase tracking-wider mb-3">Template includes</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  '✓ SKU Code, Name, Variant',
                  '✓ Brand & Category columns',
                  '✓ MRP, Cost Price, Selling Price',
                  '✓ Lead Time & MOQ',
                  '✓ Amazon ASINs, HSN Code',
                  '✓ Opening stock per warehouse',
                  ...warehouses.map(w => `🏭 ${w.name}`),
                ].map((item, i) => (
                  <p key={i} className="text-xs" style={{color: '#374151'}}>{item}</p>
                ))}
              </div>
            </div>

            {warehouses.length === 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl mb-5 text-sm"
                style={{background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706'}}>
                <AlertTriangle size={16} className="flex-shrink-0" />
                <p>Add at least one warehouse in the Warehouses tab first so stock columns are included in the template.</p>
              </div>
            )}

            <button onClick={downloadTemplate}
              className="flex items-center gap-3 px-8 py-3.5 rounded-2xl font-semibold text-white mx-auto"
              style={{background: '#1e2b71'}}>
              <Download size={18} />
              Download Template (.csv)
            </button>
            <p className="text-xs mt-3" style={{color: '#b0b4c8'}}>
              An example row is included to guide you. Delete it before uploading.
            </p>
          </div>
        </div>
      )}

      {/* ── STEP 2: Upload ── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border p-8" style={{borderColor: '#e8e5f0'}}>
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{background: '#fff0f7'}}>
              <Upload size={28} style={{color: '#d63683'}} />
            </div>
            <h2 className="text-xl font-bold text-navy mb-2">Upload Your Filled Template</h2>
            <p className="text-sm mb-6" style={{color: '#7880a4'}}>
              Upload the CSV file you downloaded and filled in. The tool will validate every row before importing.
            </p>

            {/* Upload area */}
            <label
              className="flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:bg-gray-50"
              style={{borderColor: '#d63683', background: '#fff9fc'}}>
              <Upload size={32} style={{color: '#d63683', marginBottom: '12px'}} />
              <p className="text-sm font-semibold text-navy">Click to upload CSV file</p>
              <p className="text-xs mt-1" style={{color: '#7880a4'}}>Only .csv files accepted</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            <button onClick={() => setStep(1)}
              className="mt-4 text-sm font-medium"
              style={{color: '#7880a4'}}>
              ← Back to download template
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Preview ── */}
      {step === 3 && (
        <div className="space-y-4">

          {/* Summary bar */}
          <div className="bg-white rounded-2xl border p-5" style={{borderColor: '#e8e5f0'}}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <h2 className="font-bold text-navy">Validation Results</h2>
                <p className="text-sm" style={{color: '#7880a4'}}>
                  Review issues before importing. Rows with errors will be skipped.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border"
                  style={{borderColor: '#e8e5f0', color: '#7880a4'}}>
                  ← Re-upload
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || importableCount === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{
                    background: importableCount > 0 ? '#0f9b58' : '#e8e5f0',
                    color: importableCount > 0 ? 'white' : '#b0b4c8',
                    cursor: importableCount > 0 ? 'pointer' : 'not-allowed',
                  }}>
                  {importing
                    ? <><RefreshCw size={15} className="animate-spin" /> Importing...</>
                    : <><CheckCircle size={15} /> Import {importableCount} SKUs</>}
                </button>
              </div>
            </div>

            {/* Count pills */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{background: '#f0fdf4', border: '1px solid #bbf7d0'}}>
                <CheckCircle size={14} style={{color: '#0f9b58'}} />
                <span className="text-sm font-bold" style={{color: '#0f9b58'}}>{validCount} ready</span>
              </div>
              {warningCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{background: '#fffbeb', border: '1px solid #fde68a'}}>
                  <AlertTriangle size={14} style={{color: '#d97706'}} />
                  <span className="text-sm font-bold" style={{color: '#d97706'}}>{warningCount} with warnings</span>
                </div>
              )}
              {duplicateCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{background: '#f0f1fa', border: '1px solid #c7c9e8'}}>
                  <XCircle size={14} style={{color: '#7880a4'}} />
                  <span className="text-sm font-bold" style={{color: '#7880a4'}}>{duplicateCount} duplicates (will skip)</span>
                </div>
              )}
              {errorCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{background: '#fef2f2', border: '1px solid #fecaca'}}>
                  <XCircle size={14} style={{color: '#dc2626'}} />
                  <span className="text-sm font-bold" style={{color: '#dc2626'}}>{errorCount} errors (will skip)</span>
                </div>
              )}
            </div>
          </div>

          {/* Row list */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{borderColor: '#e8e5f0'}}>

            {/* Table header */}
            <div className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b"
              style={{
                gridTemplateColumns: '40px 1fr 120px 100px 100px 100px 40px',
                borderColor: '#e8e5f0', color: '#7880a4', background: '#f8f7fc'
              }}>
              <span>#</span>
              <span>SKU</span>
              <span className="text-center">Category</span>
              <span className="text-center">MRP</span>
              <span className="text-center">Cost</span>
              <span className="text-center">Status</span>
              <span />
            </div>

            {validatedRows.map((row, i) => {
              const statusConfig = {
                valid:     { color: '#0f9b58', bg: '#f0fdf4', border: '#bbf7d0', label: '✓ Ready' },
                warning:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: '⚡ Warning' },
                duplicate: { color: '#7880a4', bg: '#f0f1fa', border: '#c7c9e8', label: '⊘ Duplicate' },
                error:     { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: '✕ Error' },
              }
              const s = statusConfig[row._status]
              const isExpanded = expandedRow === i
              const totalStock = row._stockEntries?.reduce((sum, s) => sum + s.qty, 0) || 0

              return (
                <div key={i} className="border-b last:border-0" style={{borderColor: '#f0edf8',
                  background: row._status === 'error' ? '#fffafa'
                    : row._status === 'duplicate' ? '#fafafa' : 'white'}}>

                  <div
                    className="grid items-center px-5 py-3 cursor-pointer hover:bg-gray-50"
                    style={{ gridTemplateColumns: '40px 1fr 120px 100px 100px 100px 40px' }}
                    onClick={() => setExpandedRow(isExpanded ? null : i)}>

                    <span className="text-xs font-mono" style={{color: '#b0b4c8'}}>{row._rowNum}</span>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy truncate">
                        {row['Item Name'] || <span style={{color: '#fca5a5'}}>Missing name</span>}
                      </p>
                      <p className="text-xs truncate" style={{color: '#7880a4'}}>
                        {row['SKU Code'] || '—'}
                        {row['Variant'] ? ` · ${row['Variant']}` : ''}
                        {totalStock > 0 ? ` · ${totalStock} units stock` : ''}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs" style={{color: '#374151'}}>{row['Category'] || '—'}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-semibold text-navy">
                        {row['MRP'] ? `Rs. ${row['MRP']}` : <span style={{color: '#fca5a5'}}>Missing</span>}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-semibold text-navy">
                        {row['Cost Price'] ? `Rs. ${row['Cost Price']}` : <span style={{color: '#fca5a5'}}>Missing</span>}
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                        style={{background: s.bg, color: s.color, border: `1px solid ${s.border}`}}>
                        {s.label}
                      </span>
                    </div>

                    <div className="flex justify-center" style={{color: '#b0b4c8'}}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 py-4 border-t" style={{borderColor: '#f0edf8', background: '#faf9fd'}}>

                      {/* Errors */}
                      {row._errors.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-bold mb-2" style={{color: '#dc2626'}}>Errors — this row will be skipped:</p>
                          {row._errors.map((e, j) => (
                            <div key={j} className="flex items-center gap-2 text-xs mb-1" style={{color: '#dc2626'}}>
                              <XCircle size={12} /> {e}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Warnings */}
                      {row._warnings.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-bold mb-2" style={{color: '#d97706'}}>Notes:</p>
                          {row._warnings.map((w, j) => (
                            <div key={j} className="flex items-center gap-2 text-xs mb-1" style={{color: '#d97706'}}>
                              <AlertTriangle size={12} /> {w}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Stock preview */}
                      {row._stockEntries?.some(s => s.qty > 0) && (
                        <div>
                          <p className="text-xs font-bold mb-2 text-navy">Opening Stock:</p>
                          <div className="flex gap-2 flex-wrap">
                            {row._stockEntries.filter(s => s.qty > 0).map(s => (
                              <span key={s.warehouse_id}
                                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                                style={{background: '#e8f4f0', color: '#0f9b58'}}>
                                {s.warehouse_name}: {s.qty} units
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STEP 4: Done ── */}
      {step === 4 && importResult && (
        <div className="bg-white rounded-2xl border p-8" style={{borderColor: '#e8e5f0'}}>
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{background: '#f0fdf4'}}>
              <CheckCircle size={32} style={{color: '#0f9b58'}} />
            </div>
            <h2 className="text-xl font-bold text-navy mb-2">Import Complete</h2>

            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="rounded-2xl p-5 border" style={{background: '#f0fdf4', borderColor: '#bbf7d0'}}>
                <p className="text-4xl font-bold" style={{color: '#0f9b58'}}>{importResult.imported}</p>
                <p className="text-sm font-medium mt-1" style={{color: '#0f9b58'}}>SKUs imported</p>
              </div>
              <div className="rounded-2xl p-5 border"
                style={{
                  background: importResult.failed + importResult.errors + importResult.duplicates > 0 ? '#fffbeb' : '#f0fdf4',
                  borderColor: importResult.failed + importResult.errors + importResult.duplicates > 0 ? '#fde68a' : '#bbf7d0'
                }}>
                <p className="text-4xl font-bold"
                  style={{color: importResult.failed + importResult.errors + importResult.duplicates > 0 ? '#d97706' : '#0f9b58'}}>
                  {importResult.duplicates + importResult.errors + importResult.failed}
                </p>
                <p className="text-sm font-medium mt-1"
                  style={{color: importResult.duplicates + importResult.errors + importResult.failed > 0 ? '#d97706' : '#0f9b58'}}>
                  skipped
                </p>
              </div>
            </div>

            {importResult.failedRows.length > 0 && (
              <div className="text-left mb-5 p-4 rounded-xl border"
                style={{background: '#fef2f2', borderColor: '#fecaca'}}>
                <p className="text-xs font-bold text-red-600 mb-2">Failed during import:</p>
                {importResult.failedRows.map((f, i) => (
                  <p key={i} className="text-xs" style={{color: '#dc2626'}}>
                    {f.row}: {f.error}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button onClick={reset}
                className="px-6 py-3 rounded-xl font-semibold text-white"
                style={{background: '#1e2b71'}}>
                Upload More SKUs
              </button>
              <a href="/skus"
                className="px-6 py-3 rounded-xl font-semibold border inline-block"
                style={{borderColor: '#e8e5f0', color: '#7880a4'}}>
                View SKU Explorer →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}