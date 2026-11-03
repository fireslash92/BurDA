create schema burda;
revoke all on schema burda from public, anon, authenticated;
set local search_path=burda,pg_catalog;
CREATE TABLE ambassadors (
	id text PRIMARY KEY NOT NULL,
	name text NOT NULL,
	organization text NOT NULL,
	wilaya text NOT NULL,
	email text DEFAULT '' NOT NULL,
	active integer DEFAULT 1 NOT NULL,
	created_at text NOT NULL
);
CREATE TABLE periods (
	id text PRIMARY KEY NOT NULL,
	label text NOT NULL,
	starts_on text NOT NULL,
	ends_on text NOT NULL,
	locked integer DEFAULT 0 NOT NULL
);
CREATE TABLE indicators (
	id text PRIMARY KEY NOT NULL,
	period_id text NOT NULL,
	label text NOT NULL,
	description text NOT NULL,
	unit text NOT NULL,
	weight real NOT NULL,
	default_target real NOT NULL,
	position integer NOT NULL,
	FOREIGN KEY (period_id) REFERENCES periods(id) ON UPDATE no action ON DELETE no action
);
CREATE TABLE targets (
	ambassador_id text NOT NULL,
	indicator_id text NOT NULL,
	value real NOT NULL,
	PRIMARY KEY(ambassador_id, indicator_id),
	FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (indicator_id) REFERENCES indicators(id) ON UPDATE no action ON DELETE no action
);
CREATE TABLE achievements (
	id text PRIMARY KEY NOT NULL,
	ambassador_id text NOT NULL,
	indicator_id text NOT NULL,
	period_id text NOT NULL,
	title text NOT NULL,
	description text NOT NULL,
	quantity real NOT NULL,
	date text NOT NULL,
	beneficiaries integer DEFAULT 0 NOT NULL,
	evidence_url text DEFAULT '' NOT NULL,
	status text DEFAULT 'draft' NOT NULL,
	created_by text NOT NULL,
	created_at text NOT NULL,
	updated_at text NOT NULL,
	reviewer text DEFAULT '' NOT NULL,
	review_comment text DEFAULT '' NOT NULL,
	reviewed_at text,
	FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (indicator_id) REFERENCES indicators(id) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (period_id) REFERENCES periods(id) ON UPDATE no action ON DELETE no action
);
CREATE TABLE files (
	id text PRIMARY KEY NOT NULL,
	achievement_id text NOT NULL,
	key text NOT NULL,
	name text NOT NULL,
	mime text NOT NULL,
	size integer NOT NULL,
	created_at text NOT NULL,
	FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON UPDATE no action ON DELETE no action
);
CREATE TABLE audit (
	id text PRIMARY KEY NOT NULL,
	actor text NOT NULL,
	action text NOT NULL,
	entity_id text NOT NULL,
	detail text NOT NULL,
	created_at text NOT NULL
);
CREATE TABLE settings (
	key text PRIMARY KEY NOT NULL,
	value text NOT NULL
);
CREATE INDEX achievements_period_status ON achievements(period_id,status);
CREATE INDEX achievements_ambassador ON achievements(ambassador_id);
alter table ambassadors enable row level security;
alter table periods enable row level security;
alter table indicators enable row level security;
alter table targets enable row level security;
alter table achievements enable row level security;
alter table files enable row level security;
alter table audit enable row level security;
alter table settings enable row level security;

create table public.users (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check(length(trim(name))>0), job_title text not null default '',
 role text not null check(role in ('admin','reviewer','viewer','ambassador')),
 active boolean not null default true, ambassador_id text references burda.ambassadors(id),
 created_at timestamptz not null default now(),
 check(role<>'ambassador' or ambassador_id is not null)
);
alter table public.users enable row level security;
revoke all on public.users from public, anon, authenticated;
grant select on public.users to authenticated;
create policy own_profile on public.users for select to authenticated using (id=(select auth.uid()));
create index users_ambassador on public.users(ambassador_id);
create view burda.members with (security_invoker=true) as select u.id as user_id,lower(a.email) as email,u.name,u.job_title,u.role,u.active,u.ambassador_id,u.created_at from public.users u join auth.users a on a.id=u.id;
create table burda.initial_admin(email text primary key, name text not null, job_title text not null);
alter table burda.initial_admin enable row level security;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('burda-evidence','burda-evidence',false,10485760,array['application/pdf','image/png','image/jpeg','image/webp']);
