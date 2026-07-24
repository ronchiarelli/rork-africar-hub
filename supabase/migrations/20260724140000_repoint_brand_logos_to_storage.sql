-- Point brands.logo at the brand-logos storage bucket uploaded in the
-- previous migration, replacing the carlogos.org hotlinks that keep
-- intermittently breaking (see 20260724130000_brand_logos_storage.sql).
update public.brands set logo = 'https://uyryvdefcvmffmlmurom.supabase.co/storage/v1/object/public/brand-logos/audi.png' where name = 'Audi';
update public.brands set logo = 'https://uyryvdefcvmffmlmurom.supabase.co/storage/v1/object/public/brand-logos/bmw.png' where name = 'BMW';
update public.brands set logo = 'https://uyryvdefcvmffmlmurom.supabase.co/storage/v1/object/public/brand-logos/honda.png' where name = 'Honda';
update public.brands set logo = 'https://uyryvdefcvmffmlmurom.supabase.co/storage/v1/object/public/brand-logos/hyundai.png' where name = 'Hyundai';
update public.brands set logo = 'https://uyryvdefcvmffmlmurom.supabase.co/storage/v1/object/public/brand-logos/mercedes.png' where name = 'Mercedes';
update public.brands set logo = 'https://uyryvdefcvmffmlmurom.supabase.co/storage/v1/object/public/brand-logos/nissan.png' where name = 'Nissan';
update public.brands set logo = 'https://uyryvdefcvmffmlmurom.supabase.co/storage/v1/object/public/brand-logos/rangerover.png' where name = 'Range Rover';
update public.brands set logo = 'https://uyryvdefcvmffmlmurom.supabase.co/storage/v1/object/public/brand-logos/toyota.png' where name = 'Toyota';
