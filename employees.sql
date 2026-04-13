--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2026-04-01 16:04:59

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS employees;
--
-- TOC entry 5061 (class 1262 OID 16545)
-- Name: employees; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE employees WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_India.1252';


ALTER DATABASE employees OWNER TO postgres;

\connect employees

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 16885)
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    punch_in timestamp without time zone NOT NULL,
    punch_out timestamp without time zone,
    attendance_duration interval,
    status character varying(50) DEFAULT 'present'::character varying,
    user_id uuid NOT NULL,
    break_start timestamp without time zone,
    break_end timestamp without time zone,
    break_duration interval,
    CONSTRAINT attendance_status_check CHECK (((status)::text = ANY ((ARRAY['present'::character varying, 'absent'::character varying, 'half_day'::character varying])::text[])))
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16898)
-- Name: breaks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.breaks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    attendance_id uuid NOT NULL,
    break_start timestamp without time zone NOT NULL,
    break_end timestamp without time zone,
    duration_minutes integer
);


ALTER TABLE public.breaks OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 25223)
-- Name: emergency_contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.emergency_contacts (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    primary_contact_name character varying(100) NOT NULL,
    primary_contact_relationship character varying(50),
    primary_contact_phone character varying(20) NOT NULL,
    secondary_contact_name character varying(100),
    secondary_contact_relationship character varying(50),
    secondary_contact_phone character varying(20),
    medical_info text,
    CONSTRAINT chk_secondary_contact CHECK ((((secondary_contact_name IS NULL) AND (secondary_contact_phone IS NULL)) OR ((secondary_contact_name IS NOT NULL) AND (secondary_contact_phone IS NOT NULL))))
);


ALTER TABLE public.emergency_contacts OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 25222)
-- Name: emergency_contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.emergency_contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.emergency_contacts_id_seq OWNER TO postgres;

--
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 229
-- Name: emergency_contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.emergency_contacts_id_seq OWNED BY public.emergency_contacts.id;


--
-- TOC entry 220 (class 1259 OID 16716)
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    employee_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100),
    phone character varying(15) NOT NULL,
    address text,
    city character varying(100),
    dob date,
    job_title character varying(100) NOT NULL,
    profile_picture text,
    joining_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    manager_id uuid NOT NULL,
    role_id integer DEFAULT 1
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 25161)
-- Name: leave_balance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_balance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    leave_type character varying(50) NOT NULL,
    total_leaves integer DEFAULT 0 NOT NULL,
    used_leaves integer DEFAULT 0 NOT NULL,
    remaining_leaves integer DEFAULT 0 NOT NULL,
    next_accrual date,
    expiry_date date,
    notes text,
    user_id uuid
);


ALTER TABLE public.leave_balance OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16909)
-- Name: leaves; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leaves (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    leave_type character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    reason character varying(250),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    work_handover text,
    emergency_contact character varying(255),
    manager_id uuid,
    user_id uuid,
    CONSTRAINT leaves_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.leaves OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16852)
-- Name: managers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.managers (
    manager_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100),
    phone character varying(15) NOT NULL,
    address text,
    city character varying(100),
    dob date,
    department character varying(100),
    job_title character varying(100) NOT NULL,
    profile_picture text,
    joining_date date,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    role_id integer DEFAULT 2,
    reporting_manager uuid
);


ALTER TABLE public.managers OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 25177)
-- Name: manual_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manual_entries (
    manual_id uuid DEFAULT gen_random_uuid() NOT NULL,
    entry_type character varying(50) NOT NULL,
    entry_time time without time zone NOT NULL,
    date date NOT NULL,
    work_location text,
    project_code text,
    reason_type text NOT NULL,
    explanation text NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    approval_manager_id uuid,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    employee_id uuid NOT NULL,
    CONSTRAINT manual_entries_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.manual_entries OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16804)
-- Name: manual_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manual_entry (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    entry_type character varying(100),
    entry_date date NOT NULL,
    entry_time time without time zone NOT NULL,
    location character varying(255),
    project character varying(255),
    reason text,
    status character varying(50),
    manager_id uuid,
    submit_status boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.manual_entry OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16747)
-- Name: medical_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medical_info (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    allergies text,
    conditions text,
    medications text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.medical_info OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16688)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying(100) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16687)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 217
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 232 (class 1259 OID 25255)
-- Name: shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shifts (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    shift_time text[] NOT NULL,
    maximum_hours integer DEFAULT 40,
    unavailable_days character varying(250) DEFAULT 'Sundays, Saturdays, Major holidays'::character varying,
    notes text
);


ALTER TABLE public.shifts OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 25254)
-- Name: shifts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shifts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shifts_id_seq OWNER TO postgres;

--
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 231
-- Name: shifts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shifts_id_seq OWNED BY public.shifts.id;


--
-- TOC entry 233 (class 1259 OID 33944)
-- Name: user_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    credential_id text,
    public_key text,
    created_at timestamp without time zone DEFAULT now(),
    counter integer DEFAULT 0
);


ALTER TABLE public.user_devices OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16699)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    roll_no character varying(100),
    role_id integer NOT NULL,
    face_descriptor double precision[]
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4824 (class 2604 OID 25226)
-- Name: emergency_contacts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency_contacts ALTER COLUMN id SET DEFAULT nextval('public.emergency_contacts_id_seq'::regclass);


--
-- TOC entry 4790 (class 2604 OID 16691)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4825 (class 2604 OID 25258)
-- Name: shifts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts ALTER COLUMN id SET DEFAULT nextval('public.shifts_id_seq'::regclass);


--
-- TOC entry 5046 (class 0 OID 16885)
-- Dependencies: 224
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.attendance VALUES ('27eb561d-789a-4b08-9cab-8d6208cd3db3', '2026-02-15 16:49:36.713659', '2026-02-15 16:49:45.96248', '00:00:09.248821', 'present', 'c72de699-0401-45a1-85e7-05893ea1e4bd', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('ba96b962-20c2-4553-9d11-b61be84c5db4', '2026-02-17 01:52:39.216004', '2026-02-17 01:52:43.840788', '00:00:04.624784', 'present', 'da6827f3-b62a-44d7-a608-c5e4c95f3051', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('995de21b-be8e-4555-af26-86d1d6bdef0f', '2026-02-17 03:14:01.331235', '2026-02-17 03:14:05.759503', '00:00:04.428268', 'present', '1c783005-3018-460b-998c-bf505cb4b430', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('aaecf42c-a454-4bb6-9b30-455147a0deeb', '2026-02-17 23:47:19.538445', '2026-02-17 23:55:27.534344', '00:08:07.995899', 'present', 'c72de699-0401-45a1-85e7-05893ea1e4bd', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('cb10c51a-00d3-4299-9e39-fd50b961191b', '2026-02-18 01:47:39.025625', '2026-02-18 01:51:35.585313', '00:03:56.559688', 'present', 'da6827f3-b62a-44d7-a608-c5e4c95f3051', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('81f7e3d5-f625-4f6a-8ba1-edf70995a116', '2026-02-18 09:28:51.555633', '2026-02-18 09:30:25.636176', '00:01:34.080543', 'present', 'ff5ef1c4-631b-40f7-9616-5aaeb2959940', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('40025df0-9253-47be-a86d-1ccbd9894522', '2026-02-18 11:50:15.035045', NULL, NULL, 'present', '0214dc9c-d691-42e5-ada3-1842c553bffc', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('a5ca86aa-4f62-4b9d-9ed2-bb3e819701f3', '2025-07-02 11:34:28.190154', '2025-07-02 11:35:03.622066', '00:00:35.431912', 'present', 'd9fc03ff-9db9-4b39-b1b3-dfd95bf779a1', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('5c6d57d1-71e0-436f-9e39-4e4bf19ae3ef', '2025-07-08 14:59:10.004193', '2025-07-08 15:07:43.149334', '00:08:33.145141', 'present', 'dd721ae9-8db8-4222-9680-3b8baa82932f', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('239e0044-f1ca-4a9a-80f9-4b44ce642dcc', '2025-07-08 15:49:04.316082', '2025-07-08 15:53:13.625778', '00:04:09.309696', 'present', '8e5838eb-1bf9-427b-bd86-0ce929335202', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('dca226ec-c673-40e7-b660-95eac35f0b21', '2025-07-12 13:15:04.088411', '2025-07-12 13:49:40.963698', '00:34:36.875287', 'present', '8e5838eb-1bf9-427b-bd86-0ce929335202', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('49703de1-723d-4f35-aa15-c86da59fb994', '2025-07-12 22:38:28.539625', '2025-07-12 23:01:06.39035', '00:22:37.850725', 'present', 'a3bfdb3f-090a-4a64-b93a-e7fbddda9677', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('9bb649ca-9939-4bcf-8dba-075bef2ea322', '2025-07-13 09:58:50.691345', '2025-07-13 10:11:26.988498', '00:12:36.297153', 'present', 'dd721ae9-8db8-4222-9680-3b8baa82932f', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('637024db-f440-4a69-8bff-4d470e3058c9', '2025-07-13 10:26:48.025412', NULL, NULL, 'present', '317f932c-aafe-4ab5-b40c-a4330ca99e7f', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('2bf7a6fa-d83d-44f8-aa23-88bf514a5f8a', '2025-07-14 09:57:09.668314', '2025-07-14 10:01:41.859314', '00:04:32.191', 'present', '317f932c-aafe-4ab5-b40c-a4330ca99e7f', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('5547468a-35f6-4b32-b0e6-3ecc90bb3706', '2025-07-14 11:23:43.414697', '2025-07-14 11:29:26.51223', '00:05:43.097533', 'present', 'dd721ae9-8db8-4222-9680-3b8baa82932f', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('fce6c843-9f9f-46cc-934b-0c07c3ab42e4', '2025-07-14 11:29:46.491282', '2025-07-14 11:44:30.810084', '00:14:44.318802', 'present', '8e5838eb-1bf9-427b-bd86-0ce929335202', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('0c141491-d2d5-4fc4-aa62-2492c02c57ae', '2025-07-15 09:37:01.467072', '2025-07-15 09:52:49.390476', '00:15:47.923404', 'present', 'cd2f2db8-4501-453e-a270-da7c54605081', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('a47a9ecf-fe92-4b4f-8c65-30977ab0e8e5', '2025-07-15 09:36:38.909117', '2025-07-15 09:54:26.322698', '00:17:47.413581', 'present', '61972303-a17b-426b-9ae7-65c2d89bbd0c', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('fdfede6e-17ba-41b1-87ca-e46628336227', '2025-10-31 00:38:21.94827', '2025-10-31 00:38:44.724743', '00:00:22.776473', 'present', '186ae7ce-0806-42d2-9604-9ae60fbbbf6b', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('cc7878b9-3ee2-41f4-942e-ca61c398616d', '2025-11-18 16:05:56.700495', '2025-11-18 16:07:28.539472', '00:01:31.838977', 'present', 'a8cce5c5-65b9-43df-8344-6fe2af2879da', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('71c75531-3244-4b5a-9711-451c6e434c7d', '2025-11-19 02:49:42.010214', NULL, NULL, 'present', '2a92f49f-b2f7-41d2-8341-21dc4323510c', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('635ed86e-19e2-4776-8c82-dc3387b2544c', '2025-11-19 02:51:20.679284', '2025-11-19 02:55:16.665293', '00:03:55.986009', 'present', '3a8ea06c-cd30-48d6-aa55-9bd252c797ad', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('e0510727-0c6b-4b46-94ca-848ddf85b934', '2025-11-19 13:18:09.12379', '2025-11-19 13:19:29.530607', '00:01:20.406817', 'present', '84d44db1-ed64-45b3-a1ee-8f0f4afa3b9f', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.attendance VALUES ('15c5c1a7-3d74-4ee2-8107-f66f17073e92', '2025-11-19 15:09:01.725416', '2025-11-19 23:51:27.804554', '08:42:26.079138', 'present', 'c72de699-0401-45a1-85e7-05893ea1e4bd', NULL, NULL, NULL) ON CONFLICT DO NOTHING;


--
-- TOC entry 5047 (class 0 OID 16898)
-- Dependencies: 225
-- Data for Name: breaks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5052 (class 0 OID 25223)
-- Dependencies: 230
-- Data for Name: emergency_contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.emergency_contacts VALUES (2, '8e5838eb-1bf9-427b-bd86-0ce929335202', 'a', 'a', 'a', 'a', 'a', 'a', '') ON CONFLICT DO NOTHING;
INSERT INTO public.emergency_contacts VALUES (3, '8e5838eb-1bf9-427b-bd86-0ce929335202', 'a', 'a', 'a', 'a', 'a', 'a', '') ON CONFLICT DO NOTHING;


--
-- TOC entry 5042 (class 0 OID 16716)
-- Dependencies: 220
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.employees VALUES ('27d9e5c5-e284-44e0-af23-016eec9ea491', 'dd721ae9-8db8-4222-9680-3b8baa82932f', 'Atharrv', 'Bhatnagar', '9654235576', 'sector-119', 'Noida', '2025-07-06', 'Intern', 'Not available', '2025-07-07', '2025-07-08 14:57:36.854292', '2025-07-08 14:57:36.854292', '2caceeb7-870a-41d8-b358-49ae45b1928d', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.employees VALUES ('a6196802-1aed-4667-9a41-2fc11a90ecb9', '317f932c-aafe-4ab5-b40c-a4330ca99e7f', 'Atharrv ', 'Ji', '9654235576', 'ok', 'noida', '2025-07-10', 'Intern', 'ok', '2025-07-10', '2025-07-10 16:45:59.511611', '2025-07-10 16:45:59.511611', '2caceeb7-870a-41d8-b358-49ae45b1928d', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.employees VALUES ('f3d8137b-6dfa-400a-a592-ccf49dc825b3', 'cd2f2db8-4501-453e-a270-da7c54605081', 'Parth', 'Gupta', '9654235576', '-', '-', '2025-07-15', 'Consultant', '-', '2025-07-15', '2025-07-15 09:34:28.140017', '2025-07-15 09:34:28.140017', 'f9ae52a7-1afe-4394-9301-02053fef28a4', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.employees VALUES ('72c9061e-3ae2-4f6d-80a0-ceedcd898844', 'a8cce5c5-65b9-43df-8344-6fe2af2879da', 'Atharrv', 'Bhatnagar', '12345', 'Jaipur-Ajmer Express Highway, Dehmi Kalan', 'Bagru', '2025-11-18', 'Software developer', '', '2025-11-18', '2025-11-18 16:05:21.980582', '2025-11-18 16:05:21.980582', 'aa46a051-85dc-4756-b14b-abd7042392a6', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.employees VALUES ('86d59697-94be-441a-98d9-cf9f1bfc80aa', '2a92f49f-b2f7-41d2-8341-21dc4323510c', 'Avi', 'sharma', '', '', '', NULL, '', '', NULL, '2025-11-19 02:49:33.99014', '2025-11-19 02:49:33.99014', '54b80615-8a29-4c31-8d55-46becbfdbdcd', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.employees VALUES ('93a5c2f1-58f4-440d-82d6-14dcd9e75927', '8e5838eb-1bf9-427b-bd86-0ce929335202', 'Atharrv', 'Bhatnagar', '9654235576', 'MP-2 / 1304', 'noida', '2025-07-08', 'intern', 'intern', '2025-07-08', '2025-07-10 11:53:40.509331', '2025-07-10 11:53:40.509331', '2caceeb7-870a-41d8-b358-49ae45b1928d', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.employees VALUES ('5d7ac95b-811c-4709-bd43-f610e34e3d12', '84d44db1-ed64-45b3-a1ee-8f0f4afa3b9f', 'Atharrv', 'Bhatnagar', '', '', '', NULL, '', '', NULL, '2025-11-19 03:27:52.734888', '2025-11-19 03:27:52.734888', '54b80615-8a29-4c31-8d55-46becbfdbdcd', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.employees VALUES ('cc1f6a38-2581-4c8c-bca0-a779eac9860d', '0d2f07c0-c525-4d07-8ec6-65aca6d64000', 'Arush', '', '', '', '', NULL, '', '', NULL, '2025-11-19 14:18:27.663088', '2025-11-19 14:18:27.663088', '54b80615-8a29-4c31-8d55-46becbfdbdcd', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.employees VALUES ('947083f4-b45f-479f-89a2-9ed6d3720ef3', 'da6827f3-b62a-44d7-a608-c5e4c95f3051', 'Test ', '1', '', '', '', NULL, '', '', NULL, '2026-02-17 01:38:38.985969', '2026-02-17 01:38:38.985969', 'a0b833a9-4ca5-46e1-b381-631adca1b8cc', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.employees VALUES ('f69bd568-0ef4-4e50-ba48-9164b7b02e45', '1c783005-3018-460b-998c-bf505cb4b430', 'ok', 'ji', '', '', '', NULL, '', '', NULL, '2026-02-17 02:29:32.019428', '2026-02-17 02:29:32.019428', '2caceeb7-870a-41d8-b358-49ae45b1928d', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.employees VALUES ('58e71e01-ce63-430b-b038-0be9971c59c6', 'c72de699-0401-45a1-85e7-05893ea1e4bd', 'Om', 'sharma', '9654235576', 'Jaipur', '', NULL, '', '', NULL, '2025-11-19 15:08:55.041068', '2025-11-19 15:08:55.041068', 'a0b833a9-4ca5-46e1-b381-631adca1b8cc', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.employees VALUES ('a8d493a7-e7af-4e5a-be36-469eb028295b', 'ff5ef1c4-631b-40f7-9616-5aaeb2959940', 'Atharrv', 'Bhatnagar', '09654235576', 'MP2-1304 , Eldeco Aamantran', 'Noida', '2026-02-18', 'Software engineer', '', NULL, '2026-02-18 09:28:06.207308', '2026-02-18 09:28:06.207308', 'a0b833a9-4ca5-46e1-b381-631adca1b8cc', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.employees VALUES ('1fc59995-a9dc-4e8d-9141-29954d9f1b1f', '0214dc9c-d691-42e5-ada3-1842c553bffc', 'Atharrv', 'Bhatnagar', '', '', '', NULL, '', '', NULL, '2026-02-18 10:35:35.708362', '2026-02-18 10:35:35.708362', 'a0b833a9-4ca5-46e1-b381-631adca1b8cc', 1) ON CONFLICT DO NOTHING;


--
-- TOC entry 5049 (class 0 OID 25161)
-- Dependencies: 227
-- Data for Name: leave_balance; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.leave_balance VALUES ('0f39f532-9f14-4cbc-9325-e136f0e4a9dd', 'sick', 10, 4, 0, '2026-11-19', '2026-11-19', NULL, '0d2f07c0-c525-4d07-8ec6-65aca6d64000') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('1b608880-c22e-446d-9981-da94d71dba57', 'sick', 10, 0, 0, '2026-07-10', '2026-07-10', NULL, '317f932c-aafe-4ab5-b40c-a4330ca99e7f') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('ffc9f91b-77fe-4162-a8e4-6bb3c87c5ec4', 'maternity', 90, 0, 0, '2026-07-10', '2026-07-10', NULL, '317f932c-aafe-4ab5-b40c-a4330ca99e7f') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('458067f6-3922-4d19-aee7-d88c8063b834', 'personal', 5, 3, 0, '2026-07-10', '2026-07-10', NULL, '317f932c-aafe-4ab5-b40c-a4330ca99e7f') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('7a3cf0c1-5f91-4933-a0e1-3e66a194e441', 'annual', 25, 0, 0, '2026-07-10', '2026-07-10', NULL, '340f7c4e-392a-4bf6-a28d-fd90da33d3e2') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('ef992f14-b98d-454d-bca4-f60cb77a1dd1', 'sick', 10, 0, 0, '2026-07-10', '2026-07-10', NULL, '340f7c4e-392a-4bf6-a28d-fd90da33d3e2') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('e3e3c7b3-cd32-4d16-bb56-d7b37e7dafc7', 'maternity', 90, 0, 0, '2026-07-10', '2026-07-10', NULL, '340f7c4e-392a-4bf6-a28d-fd90da33d3e2') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('84b7b36a-6edf-4efc-934e-cbf47e92af17', 'personal', 5, 2, 0, '2026-07-10', '2026-07-10', NULL, '340f7c4e-392a-4bf6-a28d-fd90da33d3e2') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('ff1e36aa-43a9-4979-9427-13ec28cec4da', 'annual', 25, 0, 0, '2026-07-12', '2026-07-12', NULL, 'a3bfdb3f-090a-4a64-b93a-e7fbddda9677') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('dc50f55c-037e-4438-b962-337e2916530a', 'personal', 5, 0, 0, '2026-07-12', '2026-07-12', NULL, 'a3bfdb3f-090a-4a64-b93a-e7fbddda9677') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('156de8ae-fcd5-4372-bd45-666c3b6bfb33', 'maternity', 90, 0, 0, '2026-07-12', '2026-07-12', NULL, 'a3bfdb3f-090a-4a64-b93a-e7fbddda9677') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('18e6cb08-7471-4894-b354-4592f59c6f4b', 'sick', 10, 0, 0, '2026-07-12', '2026-07-12', NULL, 'a3bfdb3f-090a-4a64-b93a-e7fbddda9677') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('caba569c-4c62-4871-9121-8696c8511d4b', 'annual', 25, 0, 0, '2026-11-19', '2026-11-19', NULL, 'c72de699-0401-45a1-85e7-05893ea1e4bd') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('1b1371c3-23c7-4906-b0b3-8c964694d579', 'annual', 25, 8, 0, '2026-07-10', '2026-07-10', NULL, '317f932c-aafe-4ab5-b40c-a4330ca99e7f') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('60510a22-0162-4ee1-8d9f-48ee8c00fcfa', 'annual', 25, 0, 0, '2026-07-14', '2026-07-14', NULL, 'b2bb5f12-01de-4c85-8c90-e2e1146333ec') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('502311cf-e88b-4473-a546-ef9893dca48d', 'sick', 10, 0, 0, '2026-07-14', '2026-07-14', NULL, 'b2bb5f12-01de-4c85-8c90-e2e1146333ec') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('38199a47-5170-41c5-961a-150f7de7e6ca', 'personal', 5, 0, 0, '2026-07-14', '2026-07-14', NULL, 'b2bb5f12-01de-4c85-8c90-e2e1146333ec') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('4fbf2e6e-adc5-4039-8fd5-0b456a5ff532', 'maternity', 90, 0, 0, '2026-07-14', '2026-07-14', NULL, 'b2bb5f12-01de-4c85-8c90-e2e1146333ec') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('aed3fb61-bab8-4504-a5bf-2f472098b080', 'annual', 25, 0, 0, '2026-07-15', '2026-07-15', NULL, '61972303-a17b-426b-9ae7-65c2d89bbd0c') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('d63e505d-3413-4964-8cf7-fe6b12d38427', 'sick', 10, 0, 0, '2026-07-15', '2026-07-15', NULL, '61972303-a17b-426b-9ae7-65c2d89bbd0c') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('2bffc309-b162-43ff-8dc2-44c33f09376c', 'personal', 5, 0, 0, '2026-07-15', '2026-07-15', NULL, '61972303-a17b-426b-9ae7-65c2d89bbd0c') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('91831f73-e652-4074-a2ee-5cd900c84307', 'maternity', 90, 0, 0, '2026-07-15', '2026-07-15', NULL, '61972303-a17b-426b-9ae7-65c2d89bbd0c') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('1d8cbc88-4da2-4cfd-97ca-f9abf7633a71', 'sick', 10, 0, 0, '2026-07-15', '2026-07-15', NULL, 'cd2f2db8-4501-453e-a270-da7c54605081') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('dae85830-d045-478d-98b6-be49b4fb9e12', 'personal', 5, 0, 0, '2026-07-15', '2026-07-15', NULL, 'cd2f2db8-4501-453e-a270-da7c54605081') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('031e072c-38ad-43df-953c-9ec72f99de72', 'maternity', 90, 0, 0, '2026-07-15', '2026-07-15', NULL, 'cd2f2db8-4501-453e-a270-da7c54605081') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('8bb0bb1b-d8c5-4355-858a-ea438fd7181b', 'annual', 25, 4, 0, '2026-07-15', '2026-07-15', NULL, 'cd2f2db8-4501-453e-a270-da7c54605081') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('2fd74418-8522-4706-8432-90e685b053ef', 'annual', 25, 0, 0, '2026-10-31', '2026-10-31', NULL, '186ae7ce-0806-42d2-9604-9ae60fbbbf6b') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('168f0766-0418-4188-b861-052ee56629bd', 'sick', 10, 0, 0, '2026-10-31', '2026-10-31', NULL, '186ae7ce-0806-42d2-9604-9ae60fbbbf6b') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('95667898-197d-4db2-a087-31f99b15e98e', 'personal', 5, 0, 0, '2026-10-31', '2026-10-31', NULL, '186ae7ce-0806-42d2-9604-9ae60fbbbf6b') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('8db8972c-de5e-4c11-a553-8ec367a9d1d6', 'maternity', 90, 0, 0, '2026-10-31', '2026-10-31', NULL, '186ae7ce-0806-42d2-9604-9ae60fbbbf6b') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('f893a50c-962f-4f28-876a-baf21abf3dc9', 'annual', 25, 0, 0, '2026-10-31', '2026-10-31', NULL, '0a0a0f20-bbb4-4b30-8d94-e56751b914f4') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('03d907af-d48c-4422-8392-cde88917e5dc', 'sick', 10, 0, 0, '2026-10-31', '2026-10-31', NULL, '0a0a0f20-bbb4-4b30-8d94-e56751b914f4') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('115cf5d1-9c26-4e0e-a77d-03ff59356f4f', 'personal', 5, 0, 0, '2026-10-31', '2026-10-31', NULL, '0a0a0f20-bbb4-4b30-8d94-e56751b914f4') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('fa4b7bba-cfe3-4f47-a509-8439e54389b3', 'maternity', 90, 0, 0, '2026-10-31', '2026-10-31', NULL, '0a0a0f20-bbb4-4b30-8d94-e56751b914f4') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('9e4f68e1-1e02-4f6f-adc5-065ab97762b2', 'annual', 25, 0, 0, '2026-10-31', '2026-10-31', NULL, '65b518e9-7ab7-43c2-9f28-bf715311a1aa') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('4821a99f-561e-4559-a808-0304f734fb87', 'sick', 10, 0, 0, '2026-10-31', '2026-10-31', NULL, '65b518e9-7ab7-43c2-9f28-bf715311a1aa') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('4c388a2b-ecb7-4d91-8716-af2ca3d36267', 'personal', 5, 0, 0, '2026-10-31', '2026-10-31', NULL, '65b518e9-7ab7-43c2-9f28-bf715311a1aa') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('13d4457a-2fc0-4f39-8515-d9df10a39200', 'maternity', 90, 0, 0, '2026-10-31', '2026-10-31', NULL, '65b518e9-7ab7-43c2-9f28-bf715311a1aa') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('ca44c203-09c3-43a8-9f25-0d379a839310', 'annual', 25, 0, 0, '2026-11-18', '2026-11-18', NULL, 'a8cce5c5-65b9-43df-8344-6fe2af2879da') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('ec8d537d-1054-4ca9-8ec1-2d4a8a1c6e9f', 'sick', 10, 0, 0, '2026-11-18', '2026-11-18', NULL, 'a8cce5c5-65b9-43df-8344-6fe2af2879da') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('32e75edc-4cb7-4014-8718-9b73c54bc510', 'personal', 5, 0, 0, '2026-11-18', '2026-11-18', NULL, 'a8cce5c5-65b9-43df-8344-6fe2af2879da') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('7a2a50fe-e8d2-43d8-914d-639172c391cc', 'maternity', 90, 0, 0, '2026-11-18', '2026-11-18', NULL, 'a8cce5c5-65b9-43df-8344-6fe2af2879da') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('9e190f8d-b742-4f9b-bdb4-850896cb212f', 'annual', 25, 0, 0, '2026-11-18', '2026-11-18', NULL, '88eb4c2a-0e56-47a2-a84a-2e8cac875000') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('b3590391-63dd-472a-aef5-440673b9c4e7', 'sick', 10, 0, 0, '2026-11-18', '2026-11-18', NULL, '88eb4c2a-0e56-47a2-a84a-2e8cac875000') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('a3260f87-e99a-4ed1-a5a1-ae8a6222e6aa', 'personal', 5, 0, 0, '2026-11-18', '2026-11-18', NULL, '88eb4c2a-0e56-47a2-a84a-2e8cac875000') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('e791c617-5a44-4975-967a-7a07344e437c', 'maternity', 90, 0, 0, '2026-11-18', '2026-11-18', NULL, '88eb4c2a-0e56-47a2-a84a-2e8cac875000') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('3147cd8b-511c-469b-9daa-ec4a37590718', 'annual', 25, 0, 0, '2026-11-19', '2026-11-19', NULL, '3a8ea06c-cd30-48d6-aa55-9bd252c797ad') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('4927ce5a-a2a7-40ef-a9b9-9ed463f434bb', 'sick', 10, 0, 0, '2026-11-19', '2026-11-19', NULL, '3a8ea06c-cd30-48d6-aa55-9bd252c797ad') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('1f6626fe-cc5c-4fe1-ad3d-40b129042a95', 'personal', 5, 0, 0, '2026-11-19', '2026-11-19', NULL, '3a8ea06c-cd30-48d6-aa55-9bd252c797ad') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('50ca50ef-dc96-47f9-b8a2-3d35a0a1b97f', 'maternity', 90, 0, 0, '2026-11-19', '2026-11-19', NULL, '3a8ea06c-cd30-48d6-aa55-9bd252c797ad') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('a6d8d335-c256-43cb-a174-5554e0594dd7', 'annual', 25, 0, 0, '2026-11-19', '2026-11-19', NULL, '2a92f49f-b2f7-41d2-8341-21dc4323510c') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('94f1c7e4-bc31-42d1-9243-d9c062b292ca', 'sick', 10, 0, 0, '2026-11-19', '2026-11-19', NULL, '2a92f49f-b2f7-41d2-8341-21dc4323510c') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('e50ed0e8-4730-42eb-a14c-a7c2c944f2b4', 'personal', 5, 0, 0, '2026-11-19', '2026-11-19', NULL, '2a92f49f-b2f7-41d2-8341-21dc4323510c') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('7dff1da2-1f2d-4368-896c-26409878ab34', 'maternity', 90, 0, 0, '2026-11-19', '2026-11-19', NULL, '2a92f49f-b2f7-41d2-8341-21dc4323510c') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('2bec5a16-9169-458e-abc0-95b2f59043d2', 'annual', 25, 0, 0, '2026-11-19', '2026-11-19', NULL, '6311561d-287c-4711-855e-113ea31da67f') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('48d2080e-d034-457f-9a8a-e67588d6504b', 'sick', 10, 0, 0, '2026-11-19', '2026-11-19', NULL, '6311561d-287c-4711-855e-113ea31da67f') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('a9fff994-4f09-4942-bd5e-eabcc1b7ac58', 'personal', 5, 0, 0, '2026-11-19', '2026-11-19', NULL, '6311561d-287c-4711-855e-113ea31da67f') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('653b9e3d-2dbe-4a60-9eed-5e3d9138041b', 'maternity', 90, 0, 0, '2026-11-19', '2026-11-19', NULL, '6311561d-287c-4711-855e-113ea31da67f') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('30e5384c-6bfe-4a90-9bb3-24b8f3788a73', 'annual', 25, 0, 0, '2026-11-19', '2026-11-19', NULL, '84d44db1-ed64-45b3-a1ee-8f0f4afa3b9f') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('789969c5-fa0e-4791-8947-0ba785e6d661', 'personal', 5, 0, 0, '2026-11-19', '2026-11-19', NULL, '84d44db1-ed64-45b3-a1ee-8f0f4afa3b9f') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('661c76c5-7156-4d0b-971b-09009acd8707', 'maternity', 90, 0, 0, '2026-11-19', '2026-11-19', NULL, '84d44db1-ed64-45b3-a1ee-8f0f4afa3b9f') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('e09ff0a0-45e1-4335-a774-627eaecf837a', 'sick', 10, 2, 0, '2026-11-19', '2026-11-19', NULL, '84d44db1-ed64-45b3-a1ee-8f0f4afa3b9f') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('593b64da-4a9d-48ae-a955-660f6061fd6b', 'annual', 25, 0, 0, '2026-11-19', '2026-11-19', NULL, '0d2f07c0-c525-4d07-8ec6-65aca6d64000') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('32a37204-7159-4ab2-865e-af7a07433ba7', 'personal', 5, 0, 0, '2026-11-19', '2026-11-19', NULL, '0d2f07c0-c525-4d07-8ec6-65aca6d64000') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('693abffc-9a2c-4b50-8aa0-53a0d6f006e8', 'maternity', 90, 0, 0, '2026-11-19', '2026-11-19', NULL, '0d2f07c0-c525-4d07-8ec6-65aca6d64000') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('e33bf5bc-ca7b-4c5e-9be1-c72c612759d2', 'personal', 5, 0, 0, '2026-11-19', '2026-11-19', NULL, 'c72de699-0401-45a1-85e7-05893ea1e4bd') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('ed6547a9-a919-4351-b4ee-aa451ca0a96e', 'maternity', 90, 0, 0, '2026-11-19', '2026-11-19', NULL, 'c72de699-0401-45a1-85e7-05893ea1e4bd') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('6160f99b-ec1c-4ac0-8d17-141a5d5e5eaf', 'annual', 25, 0, 0, '2027-02-13', '2027-02-13', NULL, '45222c7f-da25-4a29-89bc-4a29df3f7093') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('38a58ef6-22c5-4ebc-993b-ab2af757eafe', 'sick', 10, 0, 0, '2027-02-13', '2027-02-13', NULL, '45222c7f-da25-4a29-89bc-4a29df3f7093') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('805e65ef-d999-4db1-8903-0e38d67f12ef', 'personal', 5, 0, 0, '2027-02-13', '2027-02-13', NULL, '45222c7f-da25-4a29-89bc-4a29df3f7093') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('61a585fa-fd9c-48bb-a174-6b8dae158e35', 'maternity', 90, 0, 0, '2027-02-13', '2027-02-13', NULL, '45222c7f-da25-4a29-89bc-4a29df3f7093') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('bb7e9a69-9b48-4780-a966-b02ce6752115', 'annual', 25, 0, 0, '2027-02-13', '2027-02-13', NULL, '79ad375e-1b87-46c6-96f3-ec7be4aec3fd') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('8df8a28f-9649-43f9-a711-50fadb3ed424', 'sick', 10, 0, 0, '2027-02-13', '2027-02-13', NULL, '79ad375e-1b87-46c6-96f3-ec7be4aec3fd') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('bc4bb181-2301-4545-a222-8370df4b0d34', 'personal', 5, 0, 0, '2027-02-13', '2027-02-13', NULL, '79ad375e-1b87-46c6-96f3-ec7be4aec3fd') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('9e9b3142-2cb3-462c-877b-62f1a1da4d0a', 'maternity', 90, 0, 0, '2027-02-13', '2027-02-13', NULL, '79ad375e-1b87-46c6-96f3-ec7be4aec3fd') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('18f814ea-728b-4d44-816e-1d7d15a7ba99', 'sick', 10, 4, 0, '2026-11-19', '2026-11-19', NULL, 'c72de699-0401-45a1-85e7-05893ea1e4bd') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('cf29456f-0130-4d7d-83b8-84f1f8c82f3c', 'annual', 25, 0, 0, '2027-02-18', '2027-02-18', NULL, 'ff5ef1c4-631b-40f7-9616-5aaeb2959940') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('41059a9b-6826-4498-bfc9-a6a651aabc3d', 'sick', 10, 0, 0, '2027-02-18', '2027-02-18', NULL, 'ff5ef1c4-631b-40f7-9616-5aaeb2959940') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('89b2e73f-29f1-4b61-8aa9-7349049a918b', 'personal', 5, 0, 0, '2027-02-18', '2027-02-18', NULL, 'ff5ef1c4-631b-40f7-9616-5aaeb2959940') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('167b4ae2-b486-480e-93b8-7d98f814b21d', 'maternity', 90, 0, 0, '2027-02-18', '2027-02-18', NULL, 'ff5ef1c4-631b-40f7-9616-5aaeb2959940') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('0f911c74-5080-4af1-93a3-d1eaee5eab78', 'annual', 25, 0, 0, '2027-02-18', '2027-02-18', NULL, '0214dc9c-d691-42e5-ada3-1842c553bffc') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('a1849ebc-4da6-4898-a76d-df7c3777aceb', 'sick', 10, 0, 0, '2027-02-18', '2027-02-18', NULL, '0214dc9c-d691-42e5-ada3-1842c553bffc') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('aa0c7ca9-0d1e-4c21-a6a7-6f6a602ffa57', 'personal', 5, 0, 0, '2027-02-18', '2027-02-18', NULL, '0214dc9c-d691-42e5-ada3-1842c553bffc') ON CONFLICT DO NOTHING;
INSERT INTO public.leave_balance VALUES ('d57d118d-9251-4dde-bf42-350e97fcc8da', 'maternity', 90, 0, 0, '2027-02-18', '2027-02-18', NULL, '0214dc9c-d691-42e5-ada3-1842c553bffc') ON CONFLICT DO NOTHING;


--
-- TOC entry 5048 (class 0 OID 16909)
-- Dependencies: 226
-- Data for Name: leaves; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.leaves VALUES ('8f18c685-3dae-4c4e-afe9-559c0fe0e65c', 'annual', '2025-07-14', '2025-07-17', 'approved', 'I want to take annual leave', '2025-07-14 11:22:18.925848', '', '9654235576', '2caceeb7-870a-41d8-b358-49ae45b1928d', '8e5838eb-1bf9-427b-bd86-0ce929335202') ON CONFLICT DO NOTHING;
INSERT INTO public.leaves VALUES ('389dacfc-a5fc-413a-a46b-acc3fa277c3e', 'annual', '2025-07-14', '2025-07-17', 'approved', 'Annual leave', '2025-07-14 11:58:48.670409', '', '9654235576', '2caceeb7-870a-41d8-b358-49ae45b1928d', '317f932c-aafe-4ab5-b40c-a4330ca99e7f') ON CONFLICT DO NOTHING;
INSERT INTO public.leaves VALUES ('43e87290-c5b8-4305-919b-e07b37a8f5a1', 'annual', '2025-07-15', '2025-07-18', 'approved', 'I want to take annual leave', '2025-07-15 09:39:36.249655', '', '9654235576', 'f9ae52a7-1afe-4394-9301-02053fef28a4', 'cd2f2db8-4501-453e-a270-da7c54605081') ON CONFLICT DO NOTHING;
INSERT INTO public.leaves VALUES ('495797a0-5acb-4c52-b20f-0b0f59e95638', 'personal', '2025-11-19', '2025-11-21', 'pending', 'I am going for holiday', '2025-11-19 02:53:41.226712', '', '', 'aa46a051-85dc-4756-b14b-abd7042392a6', '3a8ea06c-cd30-48d6-aa55-9bd252c797ad') ON CONFLICT DO NOTHING;
INSERT INTO public.leaves VALUES ('9023877f-b22e-4add-99a2-3721d6ba07db', 'sick', '2025-11-19', '2025-11-20', 'pending', 'Sick leave', '2025-11-19 02:58:40.598274', '', '1234', 'aa46a051-85dc-4756-b14b-abd7042392a6', '3a8ea06c-cd30-48d6-aa55-9bd252c797ad') ON CONFLICT DO NOTHING;
INSERT INTO public.leaves VALUES ('aa6871fc-695d-4e80-89f5-707546b1aad0', 'sick', '2025-11-19', '2025-11-20', 'approved', 'Sick leave', '2025-11-19 03:28:15.209993', '', '', '54b80615-8a29-4c31-8d55-46becbfdbdcd', '84d44db1-ed64-45b3-a1ee-8f0f4afa3b9f') ON CONFLICT DO NOTHING;
INSERT INTO public.leaves VALUES ('c7fbe6ef-ef02-4729-996f-c60cdc0925a5', 'sick', '2025-11-19', '2025-11-22', 'approved', 'I am sick', '2025-11-19 14:19:02.486536', '', '', '54b80615-8a29-4c31-8d55-46becbfdbdcd', '0d2f07c0-c525-4d07-8ec6-65aca6d64000') ON CONFLICT DO NOTHING;
INSERT INTO public.leaves VALUES ('b968dcb8-dea0-40fb-a553-f16aa25fc415', 'sick', '2026-02-17', '2026-02-20', 'pending', 'I want a leave', '2026-02-17 20:18:42.774229', 'I will handover my work to mr singh', '', '2caceeb7-870a-41d8-b358-49ae45b1928d', '1c783005-3018-460b-998c-bf505cb4b430') ON CONFLICT DO NOTHING;
INSERT INTO public.leaves VALUES ('ef345af5-943c-42a8-86fa-24150f367f3d', 'sick', '2026-02-17', '2026-02-20', 'approved', 'ok', '2026-02-17 23:55:44.779981', 'ok', '', 'a0b833a9-4ca5-46e1-b381-631adca1b8cc', 'c72de699-0401-45a1-85e7-05893ea1e4bd') ON CONFLICT DO NOTHING;
INSERT INTO public.leaves VALUES ('d6b759b5-8722-4c0a-8b6c-cafd5a5fecc7', 'personal', '2026-02-18', '2026-02-19', 'pending', 'I want a leave', '2026-02-18 11:36:58.696752', '', '', 'a0b833a9-4ca5-46e1-b381-631adca1b8cc', '0214dc9c-d691-42e5-ada3-1842c553bffc') ON CONFLICT DO NOTHING;
INSERT INTO public.leaves VALUES ('03647341-52fd-4edc-8b06-77c8ff2ba915', 'sick', '2025-07-08', '2025-07-10', 'approved', 'I am sick. ', '2025-07-08 15:01:02.64032', '', '9654235576', '2caceeb7-870a-41d8-b358-49ae45b1928d', 'dd721ae9-8db8-4222-9680-3b8baa82932f') ON CONFLICT DO NOTHING;
INSERT INTO public.leaves VALUES ('853475f9-7dcf-4ff1-b906-06bf8463d554', 'personal', '2025-07-10', '2025-07-12', 'approved', 'I am taking personal leave', '2025-07-10 12:46:50.801312', '', '9654235576', '2caceeb7-870a-41d8-b358-49ae45b1928d', '8e5838eb-1bf9-427b-bd86-0ce929335202') ON CONFLICT DO NOTHING;
INSERT INTO public.leaves VALUES ('f11a560f-8de1-41b7-8cbc-119a5891e935', 'personal', '2025-07-10', '2025-07-12', 'approved', 'Its a personal leave', '2025-07-10 16:51:25.805928', '', '9654235576', '2caceeb7-870a-41d8-b358-49ae45b1928d', '317f932c-aafe-4ab5-b40c-a4330ca99e7f') ON CONFLICT DO NOTHING;
INSERT INTO public.leaves VALUES ('82954e6a-5efa-4648-98ad-558aa7b5ce3d', 'personal', '2025-07-10', '2025-07-11', 'approved', 'Personal leave is required', '2025-07-10 22:01:46.5154', '', '9654235576', '2caceeb7-870a-41d8-b358-49ae45b1928d', '340f7c4e-392a-4bf6-a28d-fd90da33d3e2') ON CONFLICT DO NOTHING;
INSERT INTO public.leaves VALUES ('fa94650d-acd8-4a4c-a55d-2415b28ea5ce', 'annual', '2025-07-13', '2025-07-16', 'approved', 'Zfghjkl;kjhgfdzszdxfghjkl;'';lkjhgf', '2025-07-13 10:27:28.487344', '', '9654235576', '2caceeb7-870a-41d8-b358-49ae45b1928d', '317f932c-aafe-4ab5-b40c-a4330ca99e7f') ON CONFLICT DO NOTHING;


--
-- TOC entry 5045 (class 0 OID 16852)
-- Dependencies: 223
-- Data for Name: managers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.managers VALUES ('aa46a051-85dc-4756-b14b-abd7042392a6', 'e3e4a41f-f803-43a1-a938-350f03a878f4', 'Ravi', 'Sharma', '9999999999', 'Manager Street', 'Mumbai', '1990-01-01', 'Tech', 'Engineering Manager', 'https://example.com/manager.jpg', '2022-01-01', '2025-06-24 12:40:04.55383', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.managers VALUES ('2caceeb7-870a-41d8-b358-49ae45b1928d', 'dd721ae9-8db8-4222-9680-3b8baa82932f', 'Aryan', 'Sharma', '9654235576', 'sector-119', 'Noida', '2025-07-08', NULL, 'Manager', 'not available', '2025-07-08', '2025-07-08 14:53:44.359012', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.managers VALUES ('1ff2db63-ee5f-4196-b419-007693027391', '340f7c4e-392a-4bf6-a28d-fd90da33d3e2', 'Anika ', 'Bhatnagar', '9654235576', 'Noida', 'Noida', '2025-07-10', NULL, 'Software developer', 'ok', '2025-07-10', '2025-07-10 21:59:54.196054', 2, '2caceeb7-870a-41d8-b358-49ae45b1928d') ON CONFLICT DO NOTHING;
INSERT INTO public.managers VALUES ('f9ae52a7-1afe-4394-9301-02053fef28a4', '61972303-a17b-426b-9ae7-65c2d89bbd0c', 'Aman', 'Saxena', '9654235576', '-', '-', '2025-07-15', NULL, 'Manager', '', '2025-07-15', '2025-07-15 09:32:41.757615', 2, '2caceeb7-870a-41d8-b358-49ae45b1928d') ON CONFLICT DO NOTHING;
INSERT INTO public.managers VALUES ('54b80615-8a29-4c31-8d55-46becbfdbdcd', '3a8ea06c-cd30-48d6-aa55-9bd252c797ad', 'Ram', 'Sharma', '12345', '', '', NULL, NULL, '', '', NULL, '2025-11-19 02:47:40.412939', 2, 'aa46a051-85dc-4756-b14b-abd7042392a6') ON CONFLICT DO NOTHING;
INSERT INTO public.managers VALUES ('a0b833a9-4ca5-46e1-b381-631adca1b8cc', 'a016b673-abea-4a28-ae0d-82a627a5c757', 'Test', '2', '', '', '', NULL, NULL, '', '', NULL, '2026-02-17 01:37:57.495244', 2, 'aa46a051-85dc-4756-b14b-abd7042392a6') ON CONFLICT DO NOTHING;


--
-- TOC entry 5050 (class 0 OID 25177)
-- Dependencies: 228
-- Data for Name: manual_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5044 (class 0 OID 16804)
-- Dependencies: 222
-- Data for Name: manual_entry; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5043 (class 0 OID 16747)
-- Dependencies: 221
-- Data for Name: medical_info; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5040 (class 0 OID 16688)
-- Dependencies: 218
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.roles VALUES (1, '2025-06-24 00:41:52.68713', '2025-06-24 00:41:52.68713', 'employee') ON CONFLICT DO NOTHING;
INSERT INTO public.roles VALUES (2, '2025-06-24 12:08:44.106097', '2025-06-24 12:08:44.106097', 'manager') ON CONFLICT DO NOTHING;
INSERT INTO public.roles VALUES (4, '2025-07-14 15:49:34.406504', '2025-07-14 15:49:34.406504', 'admin') ON CONFLICT DO NOTHING;


--
-- TOC entry 5054 (class 0 OID 25255)
-- Dependencies: 232
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5055 (class 0 OID 33944)
-- Dependencies: 233
-- Data for Name: user_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_devices VALUES ('ba6fc418-b94c-4b3c-8ba5-830b3a0dcc1c', 'da6827f3-b62a-44d7-a608-c5e4c95f3051', 'OE9sTF9wOWprblpZT3lZdjlsRDV2WVlIejlPTW9hSUI1UldrTUNac0d2bw==', 'pQECAyYgASFYIJWheN2INuveXH7CQG8EU5sjhNCBzURJ1Ei2/siGmHP3IlggXnAYnatXpmLstq4wtIFsVgpStugmTLILU1GL5lsIWkY=', '2026-02-17 01:52:25.986139', 0) ON CONFLICT DO NOTHING;
INSERT INTO public.user_devices VALUES ('1818b5a1-c3ec-4a54-9b7b-a42086975ac9', 'da6827f3-b62a-44d7-a608-c5e4c95f3051', 'VERScURuV3p1bE8xUUpjVjdtNkNhU2VsWERXbm1mbUhqcnVmd2p3WGViTQ==', 'pQECAyYgASFYIGN3VF+10PfRZWSevV+fydkt5gKhvB+Ph/VSOQPDnaMfIlgg8dxjMtVx3k+3CxJ5YVSnvE4GdaDvnWR4Q5QHQruNDI0=', '2026-02-17 01:59:15.831399', 0) ON CONFLICT DO NOTHING;
INSERT INTO public.user_devices VALUES ('fa978545-306e-4245-8b5c-9b658e562a43', '1c783005-3018-460b-998c-bf505cb4b430', 'U2JiUjY3czdScHZqcmEtU1I1S2tpMWVtV1NMczZsc2xoM2R2WlpLbWs4QQ==', 'pQECAyYgASFYIBf/vQdcZYf6fKIgOnzYAZ91mU4xQLdnNhXSyUE6hCXvIlgg0lXsxuhLWv0ke3AbWy7IdwbMQPZjb7t+5T9O74KHHfw=', '2026-02-17 02:29:43.313292', 0) ON CONFLICT DO NOTHING;


--
-- TOC entry 5041 (class 0 OID 16699)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES ('a016b673-abea-4a28-ae0d-82a627a5c757', 'Test2@company.com', '$2b$10$pKkKAKDXiB4ogoVtn0uWju3a8icN6Jv7NeHw6nDfROsh8cFeq4aSK', '2026-02-17 01:36:08.907978', '2026-02-17 01:36:08.907978', 'yoyo213', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('1c783005-3018-460b-998c-bf505cb4b430', 'okji@company.com', '$2b$10$CAdl.SYOlPTAuu1LTQb2yuVj9vKz7MArvA1omyBeqTlgBDKiLmfIm', '2026-02-17 02:29:03.291577', '2026-02-17 02:29:03.291577', 'okji1234', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('ff5ef1c4-631b-40f7-9616-5aaeb2959940', 'atharrv@test.com', '$2b$10$.S3sRIghzI/109pgDCk7JuPu3lPDn5DNh2oDxZ.94tePm7F5H6yQy', '2026-02-18 09:24:47.449139', '2026-02-18 09:24:47.449139', 'atharrvtest123', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('e3e4a41f-f803-43a1-a938-350f03a878f4', 'manager1@gmail.com', '$2b$10$azol0Cw.3lvWx5Gcd2YAA.m1GtbMMKmgY1j7y.UULGGZQyYOxqgjK', '2025-06-24 12:39:23.627663', '2025-06-25 12:13:28.99658', '11', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('225dd996-eae1-47f9-ab94-557ab5d4a74b', 'atharrv1234@gmail.com', '$2b$10$qdFbEZcYAreieRtFrLq/zOOn5IeO5n1qgA5ia6ZDWTCuoWEC/.R5W', '2025-07-01 10:28:15.033777', '2025-07-01 10:28:15.033777', '1234', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('0e6aaed1-b6fb-4059-85e7-d0694ab21fa3', 'employee@gmail.com', '$2b$10$0yNPDXgvAUlyiIjE3/aGyujtVb822N4k7fdK3o0FDv6cSm/FWvSlq', '2025-07-01 22:43:16.040663', '2025-07-01 22:43:16.040663', 'A1234', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('d9fc03ff-9db9-4b39-b1b3-dfd95bf779a1', 'manager2459@gmail.com', '$2b$10$dBTI0uWG6Dh5tz0RLp2D5uHFegthCowMx6QiKYEpF.kXo8/0Pf83q', '2025-07-02 10:19:41.956231', '2025-07-02 10:19:41.956231', '23AB', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('ee07e00f-0c9a-4926-a846-80e602e3581a', 'employee1@gmail.com', '$2b$10$bd88Nc6A/kfkWowgbD1kgu.LkAhPGrUBphM86HK4AVopZnGyZ0lxq', '2025-07-02 23:55:43.726443', '2025-07-02 23:55:43.726443', '27A', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('8e5838eb-1bf9-427b-bd86-0ce929335202', 'atharrvemployee@gmail.com', '$2b$10$3ITY3wkBhc9xxJMd6mlSB.nfEV5cmusSH2yUrrYh80briDzhWdP6y', '2025-07-08 14:51:22.662142', '2025-07-08 14:51:22.662142', 'E1', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('dd721ae9-8db8-4222-9680-3b8baa82932f', 'atharrvmanager@gmail.com', '$2b$10$OorQ2nZAWY6BawBg2Ns5hOwhn84U7f5l2KIMAxeAwvk41SYnmXZu6', '2025-07-08 14:51:53.552017', '2025-07-08 14:51:53.552017', 'E2', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('317f932c-aafe-4ab5-b40c-a4330ca99e7f', 'atharrvji@gmail.com', '$2b$10$Y1o7Ds5fm9k7bmnderpDeuotEDqeD3Dcoff9v4e1xooy0khGWyNj6', '2025-07-10 16:45:20.557785', '2025-07-10 16:45:20.557785', 'E11', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('340f7c4e-392a-4bf6-a28d-fd90da33d3e2', 'newmanager@gmail.com', '$2b$10$sYuZhdqIJtAyJR/dXIuBSesCt60KrZsD1vZ3EgGxpvcTdNqzmO.ei', '2025-07-10 21:59:08.010753', '2025-07-10 21:59:08.010753', 'E123', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('a3bfdb3f-090a-4a64-b93a-e7fbddda9677', 'atharrv@gmail.com', '$2b$10$peBYPievDqkvQNHqgK6VWuYYzQsqXxlhVBCA7vhEtS78fcEzNPVRS', '2025-07-12 17:58:21.15888', '2025-07-12 17:58:21.15888', 'A123', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('b2bb5f12-01de-4c85-8c90-e2e1146333ec', 'atharrvadmin@gmail.com', '$2b$10$8UQ8lGu3xIhuDptwV2QFCOq38Ll1uXHJUh4cCqcCxxFSbokTbfsC2', '2025-07-14 15:53:46.297489', '2025-07-14 15:53:46.297489', 'admin1', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('61972303-a17b-426b-9ae7-65c2d89bbd0c', 'aman@gmail.com', '$2b$10$Nrs.YIe38odhxS7u9He2duo2K43/sd.RfC1NwDkmTO./EpDMcwLvi', '2025-07-15 09:31:37.617904', '2025-07-15 09:31:37.617904', 'AM1', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('cd2f2db8-4501-453e-a270-da7c54605081', 'parth@gmail.com', '$2b$10$UkMKUj18f1ob1MZSUHh0b.2sjsUK0c.tuR0GZwWJGwEwS2nUbJIji', '2025-07-15 09:33:33.914111', '2025-07-15 09:33:33.914111', 'P1', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('186ae7ce-0806-42d2-9604-9ae60fbbbf6b', 'dev@gmail.com', '$2b$10$23uNPgUQa/jnZh164EYtYOr8qiUxCnvj2QGvRRrziGWUQ7tCi1iz.', '2025-10-31 00:37:33.220518', '2025-10-31 00:37:33.220518', 'DEV123', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('0a0a0f20-bbb4-4b30-8d94-e56751b914f4', 'devmanager@gmail.com', '$2b$10$aLvKU0/7cEOcciXSm3rjmuDXFVtt4t26BwzNjwfvhe3adUklM5ulu', '2025-10-31 00:40:56.956635', '2025-10-31 00:40:56.956635', 'DEV1234', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('65b518e9-7ab7-43c2-9f28-bf715311a1aa', 'devadmin@gmail.com', '$2b$10$AWdYIIr3irMWxKQrszG3tOmjp2BqCUfRsuz11VxtUVq63CKnQcZuW', '2025-10-31 00:41:50.896923', '2025-10-31 00:41:50.896923', 'DEV12345', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('a8cce5c5-65b9-43df-8344-6fe2af2879da', 'atharrv.23fe10cse00267@muj.manipal.edu', '$2b$10$pSDUMGCiu.0oeZ.NeYBSFeOHSs/.CzSwX8ZwomtSbV2cL/5zvhGZC', '2025-11-18 16:04:20.587377', '2025-11-18 16:04:20.587377', 'A111', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('88eb4c2a-0e56-47a2-a84a-2e8cac875000', 'admin2459@gmail.com', '$2b$10$HeWcSBA2cuuiVUaXD51wmeP9GeLIQ437iAULnEg26i6QexTya3gu2', '2025-11-18 16:50:44.960227', '2025-11-18 16:50:44.960227', 'admin123', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('3a8ea06c-cd30-48d6-aa55-9bd252c797ad', 'ojas@gmail.com', '$2b$10$hf7a0nqC2uPAvnXITLib1.SioIwKge40coDYBSMYxL68Zyx4EaFXa', '2025-11-19 02:47:17.187824', '2025-11-19 02:47:17.187824', 'ojas1234', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('2a92f49f-b2f7-41d2-8341-21dc4323510c', 'atharrv1204@gmail.com', '$2b$10$i0boVXCKadUt1fJvIKXKWOAZafkhebmQJJjYEOc/qejqMFz0cNNXy', '2025-11-19 02:49:15.003221', '2025-11-19 02:49:15.003221', '12041234', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('6311561d-287c-4711-855e-113ea31da67f', 'admin1234@gmail.com', '$2b$10$zGYC6LkDP0lAWGnx3kpkZOgo7M5VLpBBCNRgGMKQbX3SgCUy2Os3G', '2025-11-19 03:10:13.013086', '2025-11-19 03:10:13.013086', '1234admin', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('84d44db1-ed64-45b3-a1ee-8f0f4afa3b9f', 'keshav@gmail.com', '$2b$10$ctQG/H1oyFjcHXK/q7Y5EeB3.dI.s4KLtG9tvMJ8WlO3imNKU6CUq', '2025-11-19 03:24:54.975199', '2025-11-19 03:24:54.975199', 'keshav12', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('0d2f07c0-c525-4d07-8ec6-65aca6d64000', 'arush@gmail.com', '$2b$10$FJ69LF4JdMPRhFxBwEFoKupgsXdxmooE30DLXmlkUBLDYOiDOMYqe', '2025-11-19 14:17:50.02811', '2025-11-19 14:17:50.02811', 'arush1234', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('c72de699-0401-45a1-85e7-05893ea1e4bd', 'om@gmail.com', '$2b$10$Ni3SWEkqcGaRyZBh6FK/KOfnBEu5xo.hdYZndGo7/k5z1ylz.tnuq', '2025-11-19 15:07:56.896007', '2025-11-19 15:07:56.896007', 'om123', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('45222c7f-da25-4a29-89bc-4a29df3f7093', 'ojasverma@company.com', '$2b$10$h65tSTllAChK/XxFTYFLseidk6Z3xqwf0QkH63v17yc6ZX0.CwmMC', '2026-02-13 18:48:01.846316', '2026-02-13 18:48:01.846316', 'ABC123456789', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('79ad375e-1b87-46c6-96f3-ec7be4aec3fd', 'akshaytiwari@company.com', '$2b$10$GULbbQXhicNJ5TC5XoZDKOvsKdgg7HlzMAXn2bxu4e7NNVASmhk76', '2026-02-13 19:37:24.220685', '2026-02-13 19:37:24.220685', 'akshay123', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('da6827f3-b62a-44d7-a608-c5e4c95f3051', 'Test1@company.com', '$2b$10$QNtQ7mdeSEOzAx4lURDMvezYMoNYqPI4/JxWJpJRkbDvRQPnn/9Y2', '2026-02-17 01:34:43.525293', '2026-02-17 01:34:43.525293', 'yoyo123', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.users VALUES ('0214dc9c-d691-42e5-ada3-1842c553bffc', 'atharrv1test@gmail.com', '$2b$10$vv2mQpdROjN.2OsjQiiH/.DN1drBnOU2Z17IsZymwGIa7IXfvairy', '2026-02-18 10:34:39.607739', '2026-02-18 10:34:39.607739', 'atharrv1test', 1, NULL) ON CONFLICT DO NOTHING;


--
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 229
-- Name: emergency_contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.emergency_contacts_id_seq', 3, true);


--
-- TOC entry 5066 (class 0 OID 0)
-- Dependencies: 217
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 231
-- Name: shifts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shifts_id_seq', 1, false);


--
-- TOC entry 4858 (class 2606 OID 16892)
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- TOC entry 4860 (class 2606 OID 16903)
-- Name: breaks breaks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.breaks
    ADD CONSTRAINT breaks_pkey PRIMARY KEY (id);


--
-- TOC entry 4868 (class 2606 OID 25231)
-- Name: emergency_contacts emergency_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency_contacts
    ADD CONSTRAINT emergency_contacts_pkey PRIMARY KEY (id);


--
-- TOC entry 4846 (class 2606 OID 16725)
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id);


--
-- TOC entry 4848 (class 2606 OID 16727)
-- Name: employees employees_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_key UNIQUE (user_id);


--
-- TOC entry 4864 (class 2606 OID 25171)
-- Name: leave_balance leave_balance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balance
    ADD CONSTRAINT leave_balance_pkey PRIMARY KEY (id);


--
-- TOC entry 4862 (class 2606 OID 16918)
-- Name: leaves leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_pkey PRIMARY KEY (id);


--
-- TOC entry 4854 (class 2606 OID 16860)
-- Name: managers managers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_pkey PRIMARY KEY (manager_id);


--
-- TOC entry 4856 (class 2606 OID 16862)
-- Name: managers managers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_user_id_key UNIQUE (user_id);


--
-- TOC entry 4866 (class 2606 OID 25188)
-- Name: manual_entries manual_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manual_entries
    ADD CONSTRAINT manual_entries_pkey PRIMARY KEY (manual_id);


--
-- TOC entry 4852 (class 2606 OID 16814)
-- Name: manual_entry manual_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manual_entry
    ADD CONSTRAINT manual_entry_pkey PRIMARY KEY (id);


--
-- TOC entry 4850 (class 2606 OID 16756)
-- Name: medical_info medical_info_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_info
    ADD CONSTRAINT medical_info_pkey PRIMARY KEY (id);


--
-- TOC entry 4836 (class 2606 OID 16851)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 4838 (class 2606 OID 16696)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4870 (class 2606 OID 25264)
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- TOC entry 4872 (class 2606 OID 33954)
-- Name: user_devices user_devices_credential_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_credential_id_key UNIQUE (credential_id);


--
-- TOC entry 4874 (class 2606 OID 33952)
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- TOC entry 4840 (class 2606 OID 16710)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4842 (class 2606 OID 16708)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4844 (class 2606 OID 16844)
-- Name: users users_roll_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_roll_no_key UNIQUE (roll_no);


--
-- TOC entry 4886 (class 2606 OID 16904)
-- Name: breaks breaks_attendance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.breaks
    ADD CONSTRAINT breaks_attendance_id_fkey FOREIGN KEY (attendance_id) REFERENCES public.attendance(id) ON DELETE CASCADE;


--
-- TOC entry 4891 (class 2606 OID 25232)
-- Name: emergency_contacts emergency_contacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency_contacts
    ADD CONSTRAINT emergency_contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4876 (class 2606 OID 25285)
-- Name: employees employees_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.managers(manager_id) ON DELETE CASCADE;


--
-- TOC entry 4877 (class 2606 OID 16874)
-- Name: employees employees_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4878 (class 2606 OID 25270)
-- Name: employees employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4885 (class 2606 OID 16924)
-- Name: attendance fk_attendance_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4890 (class 2606 OID 25189)
-- Name: manual_entries fk_manual_entry_employee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manual_entries
    ADD CONSTRAINT fk_manual_entry_employee FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON DELETE CASCADE;


--
-- TOC entry 4882 (class 2606 OID 25206)
-- Name: managers fk_reporting_manager; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT fk_reporting_manager FOREIGN KEY (reporting_manager) REFERENCES public.managers(manager_id) ON DELETE SET NULL;


--
-- TOC entry 4889 (class 2606 OID 25216)
-- Name: leave_balance leave_balance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balance
    ADD CONSTRAINT leave_balance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4887 (class 2606 OID 25290)
-- Name: leaves leaves_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.managers(manager_id) ON DELETE CASCADE;


--
-- TOC entry 4888 (class 2606 OID 25280)
-- Name: leaves leaves_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4883 (class 2606 OID 16880)
-- Name: managers managers_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4884 (class 2606 OID 25275)
-- Name: managers managers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4880 (class 2606 OID 16815)
-- Name: manual_entry manual_entry_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manual_entry
    ADD CONSTRAINT manual_entry_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- TOC entry 4881 (class 2606 OID 16820)
-- Name: manual_entry manual_entry_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manual_entry
    ADD CONSTRAINT manual_entry_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(user_id);


--
-- TOC entry 4879 (class 2606 OID 16757)
-- Name: medical_info medical_info_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_info
    ADD CONSTRAINT medical_info_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4892 (class 2606 OID 25265)
-- Name: shifts shifts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4893 (class 2606 OID 33955)
-- Name: user_devices user_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4875 (class 2606 OID 16845)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


-- Completed on 2026-04-01 16:04:59

--
-- PostgreSQL database dump complete
--

