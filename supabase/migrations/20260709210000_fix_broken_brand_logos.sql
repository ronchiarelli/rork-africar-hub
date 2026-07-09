-- Toyota, Mercedes, and Nissan's seeded logo URLs 404 (confirmed live) —
-- carlogos.org had since renamed/removed those specific filenames. Point at
-- the equivalent working URLs on the same host.
update public.brands set logo = 'https://www.carlogos.org/car-logos/toyota-logo-2020.png' where name = 'Toyota';
update public.brands set logo = 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png' where name = 'Mercedes';
update public.brands set logo = 'https://www.carlogos.org/car-logos/nissan-logo.png' where name = 'Nissan';
