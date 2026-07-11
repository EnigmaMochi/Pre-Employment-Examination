// Generates a hospital control number in the pattern PE 001-YYYY-MM-DD
// (PE = Pre-Employment). The leading number is a running sequence — the
// first saved application is 001, the next is 002, and so on — while the
// date segment always reflects the real, current date the report is saved.
export function generateHospitalNumber(sequence, date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const seq = String(sequence).padStart(3, '0')
  return `PE ${seq}-${year}-${month}-${day}`
}

// Works out the next hospital number given the numbers already in use,
// picking the next sequence value (count of existing + 1) and nudging it
// forward if that exact number was somehow already used, so two saved
// applications can never end up with the same Hospital No.
export function generateNextHospitalNumber(existingNumbers = [], date = new Date()) {
  const used = new Set(existingNumbers.filter(Boolean))
  let seq = existingNumbers.length + 1
  let candidate = generateHospitalNumber(seq, date)
  while (used.has(candidate)) {
    seq += 1
    candidate = generateHospitalNumber(seq, date)
  }
  return candidate
}
