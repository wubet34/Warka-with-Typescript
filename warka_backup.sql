--
-- PostgreSQL database dump
--

\restrict sc6TlpKJ9GA8SB0tKcNnmJmDuvgcmvkxxabzAMBMXHcje1S5r4JRO5efIuaGSda

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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
-- Name: comments; Type: TABLE; Schema: public; Owner: wubet
--

CREATE TABLE public.comments (
    id bigint NOT NULL,
    content text NOT NULL,
    user_id bigint NOT NULL,
    post_id bigint NOT NULL,
    parent_comment_id bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.comments OWNER TO wubet;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: wubet
--

CREATE SEQUENCE public.comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO wubet;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wubet
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: communities; Type: TABLE; Schema: public; Owner: wubet
--

CREATE TABLE public.communities (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    logo text,
    banner text,
    is_private boolean DEFAULT false,
    owner_id bigint NOT NULL,
    member_count integer DEFAULT 1 NOT NULL,
    post_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.communities OWNER TO wubet;

--
-- Name: communities_id_seq; Type: SEQUENCE; Schema: public; Owner: wubet
--

CREATE SEQUENCE public.communities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.communities_id_seq OWNER TO wubet;

--
-- Name: communities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wubet
--

ALTER SEQUENCE public.communities_id_seq OWNED BY public.communities.id;


--
-- Name: community_members; Type: TABLE; Schema: public; Owner: wubet
--

CREATE TABLE public.community_members (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    community_id bigint NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.community_members OWNER TO wubet;

--
-- Name: community_members_id_seq; Type: SEQUENCE; Schema: public; Owner: wubet
--

CREATE SEQUENCE public.community_members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.community_members_id_seq OWNER TO wubet;

--
-- Name: community_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wubet
--

ALTER SEQUENCE public.community_members_id_seq OWNED BY public.community_members.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: wubet
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    actor_id bigint,
    type character varying(30) NOT NULL,
    post_id bigint,
    comment_id bigint,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO wubet;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: wubet
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO wubet;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wubet
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: wubet
--

CREATE TABLE public.posts (
    id bigint NOT NULL,
    title character varying(300) NOT NULL,
    content text,
    image text,
    user_id bigint NOT NULL,
    community_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    comment_count integer DEFAULT 0 NOT NULL,
    vote_score integer DEFAULT 0 NOT NULL,
    link text
);


ALTER TABLE public.posts OWNER TO wubet;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: wubet
--

CREATE SEQUENCE public.posts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO wubet;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wubet
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: wubet
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    username character varying(30) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    profile_image text,
    bio text,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cover_image text
);


ALTER TABLE public.users OWNER TO wubet;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: wubet
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO wubet;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wubet
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: votes; Type: TABLE; Schema: public; Owner: wubet
--

CREATE TABLE public.votes (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    post_id bigint NOT NULL,
    vote smallint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT votes_vote_check CHECK ((vote = ANY (ARRAY['-1'::integer, 1])))
);


ALTER TABLE public.votes OWNER TO wubet;

--
-- Name: votes_id_seq; Type: SEQUENCE; Schema: public; Owner: wubet
--

CREATE SEQUENCE public.votes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.votes_id_seq OWNER TO wubet;

--
-- Name: votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: wubet
--

ALTER SEQUENCE public.votes_id_seq OWNED BY public.votes.id;


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: communities id; Type: DEFAULT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.communities ALTER COLUMN id SET DEFAULT nextval('public.communities_id_seq'::regclass);


--
-- Name: community_members id; Type: DEFAULT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.community_members ALTER COLUMN id SET DEFAULT nextval('public.community_members_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: votes id; Type: DEFAULT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.votes ALTER COLUMN id SET DEFAULT nextval('public.votes_id_seq'::regclass);


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: wubet
--

COPY public.comments (id, content, user_id, post_id, parent_comment_id, created_at, updated_at) FROM stdin;
2	this is nice dear	2	6	\N	2026-07-02 02:28:31.19809	2026-07-02 02:28:37.161048
5	nn	2	6	\N	2026-07-02 02:36:10.388887	2026-07-02 02:36:10.388887
6	h	2	6	2	2026-07-02 02:36:15.71866	2026-07-02 02:36:15.71866
7	wow th	2	4	\N	2026-07-02 02:38:55.32142	2026-07-02 02:38:55.32142
8	njj	2	4	7	2026-07-02 02:38:59.295759	2026-07-02 02:38:59.295759
9	hhgf	2	4	8	2026-07-02 02:39:07.388339	2026-07-02 02:39:07.388339
10	shsls	2	4	\N	2026-07-02 02:39:11.3835	2026-07-02 02:39:11.3835
11	mm/;	2	8	\N	2026-07-02 02:49:32.547379	2026-07-02 02:49:32.547379
12	nnnn	2	8	11	2026-07-02 02:49:38.574582	2026-07-02 02:49:38.574582
13	kjjj;df	2	8	12	2026-07-02 02:49:45.870648	2026-07-02 02:49:45.870648
14	jjdjdf	2	8	13	2026-07-02 02:49:49.85883	2026-07-02 02:49:49.85883
15	jdjdfld	2	8	14	2026-07-02 02:49:54.349365	2026-07-02 02:49:54.349365
16	hdhf	2	8	12	2026-07-02 02:50:08.821288	2026-07-02 02:50:08.821288
17	dhdd	2	8	11	2026-07-02 02:50:25.838336	2026-07-02 02:50:25.838336
18	i lke the way you move	2	8	\N	2026-07-02 02:50:55.080011	2026-07-02 02:50:55.080011
19	hols	2	6	6	2026-07-02 02:57:17.794166	2026-07-02 02:57:17.794166
20	hrllo	2	8	18	2026-07-02 02:59:59.889029	2026-07-02 02:59:59.889029
21	holo	2	8	\N	2026-07-02 03:02:02.129285	2026-07-02 03:02:02.129285
22	nj	2	7	\N	2026-07-02 03:08:00.990684	2026-07-02 03:08:00.990684
23	j	2	7	22	2026-07-02 03:08:06.901105	2026-07-02 03:08:06.901105
24	jj	2	7	23	2026-07-02 03:08:13.976066	2026-07-02 03:08:13.976066
25	hh\ngggjgukh	2	6	5	2026-07-02 03:10:10.830051	2026-07-02 03:10:10.830051
26	hgl	2	8	15	2026-07-02 03:17:22.878313	2026-07-02 03:17:22.878313
27	<ul><li><blockquote>hello</blockquote></li><li><blockquote><strike><u>jel</u></strike></blockquote></li></ul>	2	8	\N	2026-07-02 16:16:58.043223	2026-07-02 16:16:58.043223
28	fffg	3	9	\N	2026-07-15 18:49:40.95313	2026-07-15 18:49:40.95313
29	ddff	3	9	28	2026-07-15 18:49:48.500227	2026-07-15 18:49:48.500227
30	fff	3	9	29	2026-07-15 18:49:54.510467	2026-07-15 18:49:54.510467
31	gfff	3	9	28	2026-07-15 18:49:59.321468	2026-07-15 18:49:59.321468
32	ddd	4	10	\N	2026-07-20 18:38:23.932004	2026-07-20 18:38:23.932004
36	ggg	4	6	\N	2026-07-20 18:52:30.623638	2026-07-20 18:52:30.623638
37	cc	4	10	\N	2026-07-20 18:53:14.357618	2026-07-20 18:53:14.357618
38	jok	4	10	37	2026-07-20 18:53:19.101571	2026-07-20 18:53:19.101571
41	ff	4	21	\N	2026-07-23 11:58:46.542963	2026-07-23 11:58:46.542963
42	i	4	21	41	2026-07-23 11:58:49.444775	2026-07-23 11:58:49.444775
43	helo	6	21	42	2026-07-23 12:38:43.220196	2026-07-23 12:38:43.220196
44	hello there	6	27	\N	2026-07-27 13:31:05.336616	2026-07-27 13:31:05.336616
45	yeah me too buddy	6	28	\N	2026-07-27 13:37:09.838613	2026-07-27 13:37:09.838613
46	that's awsome	4	28	45	2026-07-27 13:37:33.512599	2026-07-27 13:37:33.512599
47	fgg	4	28	\N	2026-07-27 14:29:07.616569	2026-07-27 14:29:07.616569
48	klklkl	4	28	46	2026-07-27 14:45:33.446518	2026-07-27 14:45:33.446518
49	,nkl	4	28	48	2026-07-27 14:45:37.23953	2026-07-27 14:45:37.23953
53	hello be	6	28	46	2026-08-02 10:13:46.86071	2026-08-02 10:13:46.86071
54	waw	4	29	\N	2026-08-05 13:11:15.532595	2026-08-05 13:11:15.532595
\.


--
-- Data for Name: communities; Type: TABLE DATA; Schema: public; Owner: wubet
--

COPY public.communities (id, name, slug, description, logo, banner, is_private, owner_id, member_count, post_count, created_at, updated_at) FROM stdin;
2	Tech	tech	lets talk about tech	\N	\N	f	2	3	8	2026-07-02 02:49:02.594052	2026-07-02 02:49:02.594052
1	Programming	programming	Everything about programming.	\N	\N	f	1	4	8	2026-07-01 23:43:55.238845	2026-07-01 23:43:55.238845
3	Sport	sport	the way of life	\N	\N	f	6	3	2	2026-07-27 13:36:02.394565	2026-07-27 13:36:02.394565
\.


--
-- Data for Name: community_members; Type: TABLE DATA; Schema: public; Owner: wubet
--

COPY public.community_members (id, user_id, community_id, joined_at) FROM stdin;
3	2	1	2026-07-02 01:35:08.693017
5	1	1	2026-07-02 01:37:15.378473
6	2	2	2026-07-02 02:49:02.597343
7	4	2	2026-07-23 11:55:03.852807
8	6	2	2026-07-23 12:10:14.970064
9	6	1	2026-07-23 12:10:15.963002
10	4	1	2026-07-27 13:26:27.476431
11	6	3	2026-07-27 13:36:02.40233
17	4	3	2026-08-05 12:48:43.211136
18	7	3	2026-08-05 13:09:39.74827
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: wubet
--

COPY public.notifications (id, user_id, actor_id, type, post_id, comment_id, message, is_read, created_at) FROM stdin;
1	7	4	comment	29	54	abebe commented on your post	t	2026-08-05 13:11:15.543492
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: wubet
--

COPY public.posts (id, title, content, image, user_id, community_id, created_at, updated_at, comment_count, vote_score, link) FROM stdin;
6	My first post	Welcome to Warka!	\N	1	1	2026-07-02 01:20:22.180735	2026-07-02 01:20:22.180735	6	2	\N
2	My first post	Welcome to Warka!	\N	1	1	2026-07-02 00:45:36.262378	2026-07-02 00:45:36.262378	0	0	\N
3	My first post	Welcome to Warka!	\N	1	1	2026-07-02 01:20:16.137469	2026-07-02 01:20:16.137469	0	0	\N
5	My first post	Welcome to Warka!	\N	1	1	2026-07-02 01:20:18.909796	2026-07-02 01:20:18.909796	0	0	\N
22	FormData text test	hello world	\N	5	2	2026-07-23 12:02:54.154922	2026-07-23 12:02:54.154922	0	1	\N
25	http://localhost:5173/home	\N	/uploads/1784797549620-967337412.png	4	1	2026-07-23 12:05:49.635697	2026-07-23 12:05:49.635697	1	1	\N
27	i build this stunnig login dsign	\N	/uploads/1784799717786-349845318.png	6	2	2026-07-23 12:41:57.801132	2026-07-23 12:41:57.801132	1	1	\N
4	My first post	Welcome to Warka!	\N	1	1	2026-07-02 01:20:18.205444	2026-07-02 01:20:18.205444	4	0	\N
28	sport community	wow this is what i want	\N	4	3	2026-07-27 13:36:54.129168	2026-07-27 13:36:54.129168	6	1	\N
29	FC	+3                    FC Paragraph is a versatile Thai typeface family designed by Fontcraft (Jutipong Pusumas) and released in 2022. It features 9 weight levels and 18 styles, engineered to prevent vowels and tone marks from drifting out of alignment when tracking or spacing is adjusted.	\N	7	3	2026-08-05 13:11:05.122216	2026-08-05 13:11:05.122216	1	0	\N
23	Image post test	\N	/uploads/1784797456127-695343502.jpg	5	2	2026-07-23 12:04:16.129081	2026-07-23 12:04:16.129081	0	0	\N
21	drawDB	\N	/uploads/1784797118050-111066792.png	4	2	2026-07-23 11:58:38.05472	2026-07-23 11:58:38.05472	3	0	\N
7	helo guys	hhdlf	\N	2	1	2026-07-02 02:32:32.146241	2026-07-02 02:32:32.146241	3	1	\N
20	JSON Test	hello	\N	5	2	2026-07-20 19:40:21.91188	2026-07-20 19:40:21.91188	1	2	\N
8	yager yalelh	djdkl	\N	2	2	2026-07-02 02:49:18.490669	2026-07-02 02:49:18.490669	12	1	\N
10	Progress	today i build the front end design and integrate with backend logic	\N	4	1	2026-07-20 18:38:18.156326	2026-07-20 18:38:18.156326	5	1	\N
9	yager yalelh	'warka (Copy)'	\N	3	2	2026-07-15 18:49:31.70093	2026-07-15 18:49:31.70093	4	1	\N
24	Link post test	\N	\N	5	2	2026-07-23 12:04:16.167095	2026-07-23 12:04:16.167095	0	1	https://example.com
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: wubet
--

COPY public.users (id, username, email, password_hash, profile_image, bio, is_verified, created_at, updated_at, cover_image) FROM stdin;
1	wubet_dev	wubet@example.com	$2b$10$ku./GqY.NFt2CGrJ2qCESehAb4gYkbhS7Liy9Ht2ykaZM8anLj0rG	https://example.com/avatar.png	Full Stack Developer	f	2026-07-01 19:35:00.772811	2026-07-01 22:48:52.338791	\N
2	test	test@test.com	$2b$10$J5JK3eM6.Wjt65BEz.KJ1uJ2DR03iIDVJJF2zFhDMUdBKOsNPF08O	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKjaVWn7PSmh69vXpys6T81EjXeUn4dYH_bn1PqbWp7A&s	olalsls	f	2026-07-01 19:41:07.693221	2026-07-02 15:41:31.845599	\N
3	nejiba	nejiba@gmail.com	$2b$10$OLNR6sw0REdANXOonnH6H.XVQMqmHXGJO49ahFMD8NRfp9hA/YTea	\N	\N	f	2026-07-15 18:48:33.768939	2026-07-15 18:48:33.768939	\N
5	uploadtester	uploadtest@test.com	$2b$10$Jd7TmRlcIkDu6/LeEdGIH.7.5gOgokOAtptu9ryP1wFx3yPledAk6	\N	\N	f	2026-07-20 19:39:44.560958	2026-07-20 19:39:44.560958	\N
6	wubet	wubet453@gmail.com	$2b$10$ZrOZV9ixYjOUhXtBKZ3iO.Rs9S.EHHLfoYEvBxbRwN.WP7/mGb.Xm	/uploads/1785148241508-723200017.jpg	\N	f	2026-07-23 12:09:14.422572	2026-07-27 13:33:16.134589	/uploads/1785148396120-311034636.png
4	abebe	abebe@example.com	$2b$10$lpdmtl/DZKEnUIOcU0DvzOMPljKh3qWaQXPBytPlcLlJzP/nZklpm	/uploads/1785149092769-223086858.png	💻 Full-Stack Web Developer (PERN Stack)\r\n\r\nBuilding scalable web applications with React, TypeScript, Node.js, Express, and PostgreSQL.\r\n\r\nCurrently building Warka — an Ethiopian community platform.\r\n\r\n📍	f	2026-07-20 18:31:31.170542	2026-07-27 13:44:52.823099	/uploads/1785149092793-770564311.jpg
7	glamor	morgla120@gmail.com	$2b$10$PxnNz8o5sUBojXr02DGml.me7Ecw.89lgUedJ47R/NUtCtie7agIy	\N	\N	f	2026-08-05 13:08:48.007856	2026-08-05 13:08:48.007856	\N
\.


--
-- Data for Name: votes; Type: TABLE DATA; Schema: public; Owner: wubet
--

COPY public.votes (id, user_id, post_id, vote, created_at) FROM stdin;
4	1	6	1	2026-07-02 01:22:47.428984
6	2	6	1	2026-07-02 02:28:45.869284
7	2	7	1	2026-07-02 02:57:05.991309
8	2	8	1	2026-07-02 02:57:06.955142
63	6	28	1	2026-08-02 10:18:49.610918
16	4	20	1	2026-07-23 11:56:29.653105
17	6	25	1	2026-07-23 12:42:32.320222
18	6	20	1	2026-07-23 12:42:38.950239
19	6	10	1	2026-07-23 12:42:41.677462
20	6	9	1	2026-07-23 12:42:42.759115
35	6	27	1	2026-07-27 14:48:17.142115
36	6	24	1	2026-07-27 14:48:23.189103
55	4	22	1	2026-08-02 10:08:41.68032
\.


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wubet
--

SELECT pg_catalog.setval('public.comments_id_seq', 54, true);


--
-- Name: communities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wubet
--

SELECT pg_catalog.setval('public.communities_id_seq', 3, true);


--
-- Name: community_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wubet
--

SELECT pg_catalog.setval('public.community_members_id_seq', 18, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wubet
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, true);


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wubet
--

SELECT pg_catalog.setval('public.posts_id_seq', 29, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wubet
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: votes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: wubet
--

SELECT pg_catalog.setval('public.votes_id_seq', 63, true);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: communities communities_pkey; Type: CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_pkey PRIMARY KEY (id);


--
-- Name: communities communities_slug_key; Type: CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_slug_key UNIQUE (slug);


--
-- Name: community_members community_members_pkey; Type: CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: community_members unique_member; Type: CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT unique_member UNIQUE (user_id, community_id);


--
-- Name: votes unique_user_vote; Type: CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT unique_user_vote UNIQUE (user_id, post_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: votes votes_pkey; Type: CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_pkey PRIMARY KEY (id);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: wubet
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: comments fk_comment_post; Type: FK CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: comments fk_comment_user; Type: FK CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: community_members fk_member_community; Type: FK CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT fk_member_community FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: community_members fk_member_user; Type: FK CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: communities fk_owner; Type: FK CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT fk_owner FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments fk_parent_comment; Type: FK CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_parent_comment FOREIGN KEY (parent_comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: posts fk_post_community; Type: FK CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT fk_post_community FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: posts fk_post_user; Type: FK CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: votes fk_vote_post; Type: FK CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT fk_vote_post FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: votes fk_vote_user; Type: FK CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT fk_vote_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: wubet
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict sc6TlpKJ9GA8SB0tKcNnmJmDuvgcmvkxxabzAMBMXHcje1S5r4JRO5efIuaGSda

