-- Public catalog seed data, ported 1:1 from expo/mocks/cars.ts.
-- Only catalog data (brands/cars/sale_cars) is seeded here: these have no
-- required owner and are safe to ship as real day-one inventory. Per-user
-- data (bookings, wallets, notifications, KYC, dealer listings/leads) is
-- intentionally NOT seeded — it only makes sense tied to real auth.users
-- accounts, which don't exist until people actually sign up.

insert into public.brands (name, logo, car_count) values
  ('Toyota',      'https://www.carlogos.org/car-logos/toyota-logo-2020-europe.png', 0),
  ('Mercedes',    'https://www.carlogos.org/car-logos/mercedes-benz-logo-2011.png', 0),
  ('BMW',         'https://www.carlogos.org/car-logos/bmw-logo-2020.png', 0),
  ('Range Rover', 'https://www.carlogos.org/car-logos/land-rover-logo.png', 0),
  ('Honda',       'https://www.carlogos.org/car-logos/honda-logo-2000.png', 0),
  ('Audi',        'https://www.carlogos.org/car-logos/audi-logo-2016.png', 0),
  ('Hyundai',     'https://www.carlogos.org/car-logos/hyundai-logo-2011.png', 0),
  ('Nissan',      'https://www.carlogos.org/car-logos/nissan-logo-2020.png', 0)
on conflict (name) do nothing;

insert into public.cars (
  id, owner_id, brand, model, year, category, image, images,
  price_per_day, price_per_week, location, seats, transmission, fuel_type,
  horsepower, has_ac, is_available, description, features, owner_name, owner_phone
) values
  ('10000000-0000-0000-0000-000000000001', null, 'Toyota', 'Land Cruiser V8', 2023, 'SUV',
   'https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/7b981aba-e063-4ecf-9970-305eda1eafb4.png',
   array['https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/7b981aba-e063-4ecf-9970-305eda1eafb4.png'],
   850, 5200, 'East Legon', 7, 'Automatic', 'Diesel', 304, true, true,
   'Experience luxury and power with the Toyota Land Cruiser V8. Perfect for both city drives and off-road adventures across Ghana. Fully loaded with premium features.',
   array['GPS Navigation','Bluetooth','Leather Seats','Sunroof','Backup Camera','4WD'],
   'Kwame Auto Rentals', '+233244123456'),

  ('10000000-0000-0000-0000-000000000002', null, 'Mercedes', 'E-Class 300', 2024, 'Sedan',
   'https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/410c3a6a-18b0-4b5f-b0be-d48a127b8847.png',
   array['https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/410c3a6a-18b0-4b5f-b0be-d48a127b8847.png'],
   1200, 7500, 'Airport Area', 5, 'Automatic', 'Petrol', 255, true, true,
   'The Mercedes E-Class 300 offers unmatched elegance and comfort. Ideal for business meetings, airport transfers, and executive travel in Accra.',
   array['Ambient Lighting','Heated Seats','Premium Sound','Wireless Charging','Lane Assist'],
   'Premium Drive GH', '+233201234567'),

  ('10000000-0000-0000-0000-000000000003', null, 'BMW', 'X5 xDrive', 2023, 'SUV',
   'https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/54b67d0f-cc42-46cf-b7d2-00599786fe11.png',
   array['https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/54b67d0f-cc42-46cf-b7d2-00599786fe11.png'],
   950, 6000, 'Cantonments', 5, 'Automatic', 'Diesel', 335, true, true,
   'The BMW X5 combines sporty dynamics with luxury comfort. A powerful SUV that turns heads on the streets of Accra.',
   array['Panoramic Roof','Gesture Control','Harman Kardon Audio','Adaptive Cruise','Park Assist'],
   'Accra Luxury Cars', '+233551234567'),

  ('10000000-0000-0000-0000-000000000004', null, 'Range Rover', 'Sport HSE', 2024, 'SUV',
   'https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/f6af0402-76ca-4152-a7b7-50bf169ed9a0.png',
   array['https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/f6af0402-76ca-4152-a7b7-50bf169ed9a0.png'],
   1500, 9500, 'East Legon', 5, 'Automatic', 'Petrol', 395, true, true,
   'The Range Rover Sport HSE is the epitome of British luxury. Command the road with style and sophistication.',
   array['Terrain Response','Meridian Audio','Air Suspension','Massage Seats','HUD Display'],
   'Royal Fleet GH', '+233271234567'),

  ('10000000-0000-0000-0000-000000000005', null, 'Honda', 'CR-V Touring', 2023, 'SUV',
   'https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/0d40a077-f222-47b2-bd76-c5000e877e96.png',
   array['https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/0d40a077-f222-47b2-bd76-c5000e877e96.png'],
   450, 2800, 'Tema', 5, 'Automatic', 'Petrol', 190, true, true,
   'Reliable and fuel-efficient, the Honda CR-V is perfect for everyday drives and family trips around Greater Accra.',
   array['Apple CarPlay','Android Auto','Blind Spot Monitor','Remote Start'],
   'GH Auto Hire', '+233241234567'),

  ('10000000-0000-0000-0000-000000000006', null, 'Toyota', 'Camry XSE', 2024, 'Sedan',
   'https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/d3db8785-fcfe-4c40-8a04-6c812f7265de.png',
   array['https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/d3db8785-fcfe-4c40-8a04-6c812f7265de.png'],
   380, 2300, 'Kumasi', 5, 'Automatic', 'Hybrid', 206, true, true,
   'The Toyota Camry XSE offers a sporty ride with hybrid efficiency. A top choice for city commuting in Kumasi.',
   array['Hybrid Engine','JBL Audio','Wireless Charging','Safety Sense 2.5'],
   'Kumasi Car Rentals', '+233261234567'),

  ('10000000-0000-0000-0000-000000000007', null, 'Hyundai', 'Tucson N Line', 2023, 'SUV',
   'https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/d7ce3762-de3f-4607-b2db-997fc2e66dc7.png',
   array['https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/d7ce3762-de3f-4607-b2db-997fc2e66dc7.png'],
   400, 2500, 'Takoradi', 5, 'Automatic', 'Petrol', 187, true, true,
   'The Hyundai Tucson N Line combines bold design with practicality. Great for exploring the Western Region.',
   array['Smart Key','Bose Audio','Ventilated Seats','Digital Cluster'],
   'Western Auto GH', '+233231234567'),

  ('10000000-0000-0000-0000-000000000008', null, 'Audi', 'Q7 Premium', 2024, 'SUV',
   'https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/7b11b293-7b4c-4bcf-b00e-b66a78a92ab3.png',
   array['https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/7b11b293-7b4c-4bcf-b00e-b66a78a92ab3.png'],
   1100, 7000, 'Osu', 7, 'Automatic', 'Diesel', 335, true, false,
   'The Audi Q7 Premium is a statement of sophistication. Spacious, powerful, and packed with cutting-edge tech.',
   array['Virtual Cockpit','Matrix LED','Air Suspension','Bang & Olufsen Audio','Quattro AWD'],
   'Elite Wheels Accra', '+233501234567')
on conflict (id) do nothing;

-- Manually set rating/review_count for seed cars (normally trigger-maintained
-- from real reviews, but there are no real bookings/reviews yet at seed time).
update public.cars set rating = 4.8, review_count = 124 where id = '10000000-0000-0000-0000-000000000001';
update public.cars set rating = 4.9, review_count = 89  where id = '10000000-0000-0000-0000-000000000002';
update public.cars set rating = 4.7, review_count = 67  where id = '10000000-0000-0000-0000-000000000003';
update public.cars set rating = 4.9, review_count = 43  where id = '10000000-0000-0000-0000-000000000004';
update public.cars set rating = 4.5, review_count = 156 where id = '10000000-0000-0000-0000-000000000005';
update public.cars set rating = 4.6, review_count = 203 where id = '10000000-0000-0000-0000-000000000006';
update public.cars set rating = 4.4, review_count = 78  where id = '10000000-0000-0000-0000-000000000007';
update public.cars set rating = 4.8, review_count = 34  where id = '10000000-0000-0000-0000-000000000008';

insert into public.sale_cars (
  id, dealer_id, brand, model, year, category, image, images,
  sale_price, mileage, location, fuel_type, transmission, condition,
  dealer_name, dealer_phone, dealer_avatar, is_featured, views, description, features
) values
  ('20000000-0000-0000-0000-000000000001', null, 'Toyota', 'Highlander XLE', 2022, 'SUV',
   'https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/52f66c7b-2ed2-44c6-8c59-e604db1d71cd.png',
   array['https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/52f66c7b-2ed2-44c6-8c59-e604db1d71cd.png'],
   195000, 34000, 'East Legon', 'Petrol', 'Automatic', 'Foreign Used',
   'Accra Premium Motors', '+233201234567', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80',
   true, 892, 'Well-maintained Toyota Highlander XLE with panoramic sunroof, leather seats, and premium JBL audio.',
   array['Panoramic Sunroof','Leather Seats','JBL Audio','Blind Spot Monitor','Apple CarPlay']),

  ('20000000-0000-0000-0000-000000000002', null, 'Mercedes', 'GLC 300 4MATIC', 2023, 'SUV',
   'https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/76f9b361-67b9-47cd-a4f3-ebcbff45bbe1.png',
   array['https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/76f9b361-67b9-47cd-a4f3-ebcbff45bbe1.png'],
   380000, 12000, 'Airport Area', 'Petrol', 'Automatic', 'Foreign Used',
   'Premium Drive GH', '+233201234567', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
   true, 1245, 'Stunning Mercedes GLC 300 in pristine condition. Low mileage, fully loaded with AMG package.',
   array['AMG Package','Burmester Audio','Ambient Lighting','360 Camera','Heated Seats']),

  ('20000000-0000-0000-0000-000000000003', null, 'Honda', 'Accord Sport', 2021, 'Sedan',
   'https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/c094c615-9ce9-426d-8714-c275297becad.png',
   array['https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/c094c615-9ce9-426d-8714-c275297becad.png'],
   135000, 48000, 'Tema', 'Petrol', 'Automatic', 'Foreign Used',
   'GH Auto Sales', '+233241234567', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
   false, 567, 'Reliable Honda Accord Sport with great fuel economy. Perfect for daily commuting.',
   array['Adaptive Cruise','Lane Keep Assist','Apple CarPlay','Remote Start']),

  ('20000000-0000-0000-0000-000000000004', null, 'BMW', 'X3 M40i', 2024, 'SUV',
   'https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/fcf97e22-e677-4dbd-af5a-f23718039bbe.png',
   array['https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/fcf97e22-e677-4dbd-af5a-f23718039bbe.png'],
   420000, 5000, 'Cantonments', 'Petrol', 'Automatic', 'New',
   'Elite Wheels Accra', '+233501234567', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80',
   true, 2134, 'Brand new BMW X3 M40i with M Sport package. Incredible performance and luxury combined.',
   array['M Sport Package','Harman Kardon','Panoramic Roof','Gesture Control','Head-Up Display']),

  ('20000000-0000-0000-0000-000000000005', null, 'Hyundai', 'Elantra N', 2023, 'Sedan',
   'https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/1a183bc3-adcf-409e-9298-722f682c075a.png',
   array['https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/1a183bc3-adcf-409e-9298-722f682c075a.png'],
   98000, 22000, 'Kumasi', 'Petrol', 'Manual', 'Foreign Used',
   'Kumasi Auto Hub', '+233261234567', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
   false, 345, 'Sporty Hyundai Elantra N with manual transmission. Fun to drive with great tech features.',
   array['Sport Seats','Bose Audio','Digital Cluster','N Mode','Performance Exhaust']),

  ('20000000-0000-0000-0000-000000000006', null, 'Range Rover', 'Velar R-Dynamic', 2023, 'SUV',
   'https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/5faa9cb4-a2a6-4ce2-8317-66f4d0cf6a21.png',
   array['https://r2-pub.rork.com/projects/9ymfo06sx2296oie1juhh/assets/5faa9cb4-a2a6-4ce2-8317-66f4d0cf6a21.png'],
   365000, 18000, 'East Legon', 'Diesel', 'Automatic', 'Foreign Used',
   'Royal Fleet GH', '+233271234567', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80',
   true, 1567, 'Elegant Range Rover Velar with R-Dynamic styling. A statement of luxury and sophistication.',
   array['Meridian Audio','Air Suspension','Touch Pro Duo','Matrix LED','Terrain Response'])
on conflict (id) do nothing;
