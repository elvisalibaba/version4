-- Reproduction idempotente du backend/database/seeders/RdcEducationCatalogSeeder.php (code Laravel consulté le 13/10/2026).

BEGIN;

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_SCHOOL','Élèves','school','root',NULL,10,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRESCHOOL','Préscolaire','school','level',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_SCHOOL'),10,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRESCHOOL_1','1e année préscolaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRESCHOOL'),10,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRESCHOOL_2','2e année préscolaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRESCHOOL'),20,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRESCHOOL_3','3e année préscolaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRESCHOOL'),30,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRIMARY','Primaire','school','level',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_SCHOOL'),20,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRIMARY_1','1e année primaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRIMARY'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRIMARY_2','2e année primaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRIMARY'),20,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRIMARY_3','3e année primaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRIMARY'),30,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRIMARY_4','4e année primaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRIMARY'),40,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRIMARY_5','5e année primaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRIMARY'),50,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRIMARY_6','6e année primaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRIMARY'),60,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_CTEB','Cycle Terminal de l’Éducation de Base (CTEB)','school','level',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_SCHOOL'),30,true,true,'https://edu-nc.gouv.cd/systeme-educatif','Cycle de deux ans correspondant aux 7e et 8e années de l’Éducation de Base.','{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_CTEB_7','7e année de l’Éducation de Base','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_CTEB'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_CTEB_8','8e année de l’Éducation de Base','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_CTEB'),20,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUMANITIES','Humanités','school','level',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_SCHOOL'),40,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUMANITIES_1','1e année des Humanités','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUMANITIES'),10,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUMANITIES_2','2e année des Humanités','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUMANITIES'),20,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUMANITIES_3','3e année des Humanités','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUMANITIES'),30,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUMANITIES_4','4e année des Humanités','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUMANITIES'),40,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUM_GENERAL','Humanités générales','school','stream',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUMANITIES'),100,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUM_SCI','Humanités scientifiques','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_GENERAL'),110,true,true,'https://edu-nc.gouv.cd/programmes-nationaux','Voie scientifique rénovée.','{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_MATH_PHYS','Mathématique-Physique','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_SCI'),10,true,true,'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download',NULL,'{"legacy_or_specialization":true}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_BIO_CHIMIE','Bio-Chimie','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_SCI'),20,true,true,'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download',NULL,'{"legacy_or_specialization":true}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUM_LIT','Littéraire','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_GENERAL'),120,true,true,'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_LATIN_PHILO','Latin-Philosophie','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_LIT'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_LATIN_GREC','Latin-Grec','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_LIT'),20,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUM_PED','Pédagogie / Humanités pédagogiques','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_GENERAL'),130,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_PED_GENERAL','Pédagogie générale','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_PED'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_NORMALE','Normale','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_PED'),20,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_ED_PHYSIQUE','Éducation physique','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_PED'),30,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_IFME','Formation aux métiers de l’enseignement (IFME)','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_PED'),40,true,true,'https://edu-nc.gouv.cd/programmes-nationaux','Parcours lié à la réforme de la formation initiale des enseignants.','{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUM_TECH','Humanités techniques','school','stream',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUMANITIES'),200,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_COMM','Commerciale et Gestion','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_TECH'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_COMM_GESTION','Commerciale et Gestion','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_TECH_COMM'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{"exam_code":"301"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_SECRET','Secrétariat-Administration','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_TECH'),20,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_SECRET_ADMIN','Secrétariat-Administration','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_TECH_SECRET'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_INDUSTRY','Technique Industrielle','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_TECH'),30,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_ELECTRIC','Électricité','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_TECH_INDUSTRY'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_ELECTRONIC','Électronique','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_TECH_INDUSTRY'),20,true,true,'https://edu-nc.gouv.cd/wp-content/uploads/2023/06/ELECTRONIQUE.pdf',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_PETRO','Pétrochimie industrielle','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_TECH_INDUSTRY'),30,true,true,'https://edu-nc.gouv.cd/wp-content/uploads/2023/06/PETROCHIMIE.pdf',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_CONSTRUCTION','Construction','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_TECH_INDUSTRY'),40,true,true,'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download',NULL,'{"exam_code":"904"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_AGRI','Technique Agricole','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_TECH'),40,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_AGRICULTURE','Agriculture','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_TECH_AGRI'),10,true,true,'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download',NULL,'{"exam_code":"801"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_SOCIAL','Technique Sociale','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_TECH'),50,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_IT','Technique Informatique','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_TECH'),60,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_ART','Technique Artistique','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_TECH'),70,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUM_PRO','Humanités professionnelles','school','stream',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUMANITIES'),300,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRO_COUTURE','Coupe et Couture','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_PRO'),10,true,true,'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRO_GENERAL','Technique Professionnelle','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_PRO'),20,true,true,'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRO_ARTS_METIERS','Arts & Métiers','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_PRO'),30,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_ESU','Étudiants / Enseignement supérieur et universitaire','university','root',NULL,20,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_ESU_CYCLES','Cycles LMD','university','group',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU'),10,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_L1','Licence 1','university','cycle',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_CYCLES'),10,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_L2','Licence 2','university','cycle',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_CYCLES'),20,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_L3','Licence 3','university','cycle',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_CYCLES'),30,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_M1','Master 1','university','cycle',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_CYCLES'),40,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_M2','Master 2','university','cycle',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_CYCLES'),50,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_DOCTORATE','Doctorat','university','cycle',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_CYCLES'),60,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_ESU_DOMAINS','Domaines officiels LMD','university','group',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU'),20,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_1','Sciences de l’Homme et de la Société','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),10,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_2','Sciences de la Santé','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),20,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_3','Sciences Économiques et de Gestion','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),30,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_4','Sciences et Technologie','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),40,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_5','Sciences Juridiques, Politiques et Administratives','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),50,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_6','Sciences Psychologiques et de l’Éducation','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),60,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_7','Sciences Agronomiques et Environnement','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),70,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_8','Lettres, Langues et Arts','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),80,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_FIELD_10','Théologie Protestante','university','field',(SELECT id FROM public.academic_taxonomies WHERE code='ESU_DOMAIN_1'),100,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere','Filière officielle RegESU destinée aux étudiants en théologie.','{"regesu_id":10,"featured":true}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_MENTION_37','Théologie Pastorale','university','mention',(SELECT id FROM public.academic_taxonomies WHERE code='ESU_FIELD_10'),10,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{"regesu_id":37,"cycle_id":1,"cycle":"Licence"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_MENTION_38','Exégèses et Théologies Bibliques : Ancien Testament','university','mention',(SELECT id FROM public.academic_taxonomies WHERE code='ESU_FIELD_10'),20,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{"regesu_id":38,"cycle_id":2,"cycle":"Master"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_MENTION_39','Exégèses et Théologies Bibliques : Nouveau Testament','university','mention',(SELECT id FROM public.academic_taxonomies WHERE code='ESU_FIELD_10'),30,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{"regesu_id":39,"cycle_id":2,"cycle":"Master"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_MENTION_40','Théologie systématique et éthique','university','mention',(SELECT id FROM public.academic_taxonomies WHERE code='ESU_FIELD_10'),40,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{"regesu_id":40,"cycle_id":2,"cycle":"Master"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_MENTION_41','Théologie Pastorale','university','mention',(SELECT id FROM public.academic_taxonomies WHERE code='ESU_FIELD_10'),50,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{"regesu_id":41,"cycle_id":2,"cycle":"Master"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_MENTION_42','Histoire de l’Église','university','mention',(SELECT id FROM public.academic_taxonomies WHERE code='ESU_FIELD_10'),60,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{"regesu_id":42,"cycle_id":2,"cycle":"Master"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

COMMIT;