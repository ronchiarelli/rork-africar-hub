// Suggestions only — every brand/model field stays free-text, since no
// fixed list survives contact with the Ghanaian import market (grey
// imports, trims that never shipped here, older generations). These just
// save typing for the common cases.

export const VEHICLE_BRANDS = [
  'Toyota',
  'Hyundai',
  'Kia',
  'Nissan',
  'Honda',
  'Mercedes',
  'BMW',
  'Audi',
  'Volkswagen',
  'Ford',
  'Chevrolet',
  'Mazda',
  'Mitsubishi',
  'Suzuki',
  'Range Rover',
  'Land Rover',
  'Lexus',
  'Jeep',
  'Peugeot',
  'Renault',
  'Isuzu',
  'Subaru',
  'Volvo',
  'Tesla',
];

// Common models per brand, weighted towards what actually moves in Ghana
// (Corolla/Camry/RAV4, Elantra/Tucson, Sportage, Altima …).
export const MODELS_BY_BRAND: Record<string, string[]> = {
  Toyota: ['Corolla', 'Camry', 'RAV4', 'Highlander', 'Land Cruiser', 'Land Cruiser Prado', 'Hilux', 'Fortuner', 'Yaris', 'Avalon', 'Sienna', 'Vitz'],
  Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Accent', 'i10', 'Creta', 'Palisade', 'Venue'],
  Kia: ['Sportage', 'Sorento', 'Rio', 'Cerato', 'Picanto', 'Seltos', 'Optima', 'Telluride'],
  Nissan: ['Altima', 'Sentra', 'Rogue', 'X-Trail', 'Patrol', 'Navara', 'Qashqai', 'Murano'],
  Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Fit', 'Odyssey'],
  Mercedes: ['C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'G-Class', 'Sprinter'],
  BMW: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X6', 'X7'],
  Audi: ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8'],
  Volkswagen: ['Golf', 'Passat', 'Jetta', 'Tiguan', 'Touareg', 'Polo', 'Amarok'],
  Ford: ['Focus', 'Fusion', 'Escape', 'Explorer', 'Edge', 'Ranger', 'F-150', 'Expedition'],
  Chevrolet: ['Cruze', 'Malibu', 'Equinox', 'Traverse', 'Tahoe', 'Silverado', 'Spark'],
  Mazda: ['Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'CX-9', 'BT-50'],
  Mitsubishi: ['Lancer', 'Outlander', 'Pajero', 'L200', 'ASX', 'Montero Sport'],
  Suzuki: ['Swift', 'Vitara', 'Grand Vitara', 'Alto', 'Jimny', 'Ertiga'],
  'Range Rover': ['Evoque', 'Velar', 'Sport', 'Vogue', 'Autobiography'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Freelander'],
  Lexus: ['ES', 'IS', 'GS', 'RX', 'NX', 'GX', 'LX', 'LS'],
  Jeep: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade'],
  Peugeot: ['206', '208', '301', '308', '3008', '5008', 'Partner'],
  Renault: ['Duster', 'Logan', 'Sandero', 'Captur', 'Koleos'],
  Isuzu: ['D-Max', 'MU-X', 'NPR', 'Trooper'],
  Subaru: ['Impreza', 'Legacy', 'Outback', 'Forester', 'XV'],
  Volvo: ['S60', 'S90', 'XC40', 'XC60', 'XC90'],
  Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y'],
};
