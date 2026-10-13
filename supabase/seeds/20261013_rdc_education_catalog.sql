-- Reproduction idempotente du backend/database/seeders/RdcEducationCatalogSeeder.php (code Laravel consulté le 13/10/2026).

BEGIN;

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_SCHOOL','rdc-school','Élèves','school','root',NULL,10,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRESCHOOL','rdc-preschool','Préscolaire','school','level',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_SCHOOL'),10,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRESCHOOL_1','rdc-preschool-1','1e année préscolaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRESCHOOL'),10,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRESCHOOL_2','rdc-preschool-2','2e année préscolaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRESCHOOL'),20,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRESCHOOL_3','rdc-preschool-3','3e année préscolaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRESCHOOL'),30,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRIMARY','rdc-primary','Primaire','school','level',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_SCHOOL'),20,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRIMARY_1','rdc-primary-1','1e année primaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRIMARY'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRIMARY_2','rdc-primary-2','2e année primaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRIMARY'),20,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRIMARY_3','rdc-primary-3','3e année primaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRIMARY'),30,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRIMARY_4','rdc-primary-4','4e année primaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRIMARY'),40,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRIMARY_5','rdc-primary-5','5e année primaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRIMARY'),50,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRIMARY_6','rdc-primary-6','6e année primaire','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_PRIMARY'),60,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_CTEB','rdc-cteb','Cycle Terminal de l’Éducation de Base (CTEB)','school','level',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_SCHOOL'),30,true,true,'https://edu-nc.gouv.cd/systeme-educatif','Cycle de deux ans correspondant aux 7e et 8e années de l’Éducation de Base.','{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_CTEB_7','rdc-cteb-7','7e année de l’Éducation de Base','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_CTEB'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_CTEB_8','rdc-cteb-8','8e année de l’Éducation de Base','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_CTEB'),20,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUMANITIES','rdc-humanities','Humanités','school','level',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_SCHOOL'),40,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUMANITIES_1','rdc-humanities-1','1e année des Humanités','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUMANITIES'),10,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUMANITIES_2','rdc-humanities-2','2e année des Humanités','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUMANITIES'),20,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUMANITIES_3','rdc-humanities-3','3e année des Humanités','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUMANITIES'),30,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUMANITIES_4','rdc-humanities-4','4e année des Humanités','school','class',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUMANITIES'),40,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUM_GENERAL','rdc-hum-general','Humanités générales','school','stream',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUMANITIES'),100,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUM_SCI','rdc-hum-sci','Humanités scientifiques','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_GENERAL'),110,true,true,'https://edu-nc.gouv.cd/programmes-nationaux','Voie scientifique rénovée.','{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_MATH_PHYS','rdc-opt-math-phys','Mathématique-Physique','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_SCI'),10,true,true,'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download',NULL,'{"legacy_or_specialization":true}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_BIO_CHIMIE','rdc-opt-bio-chimie','Bio-Chimie','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_SCI'),20,true,true,'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download',NULL,'{"legacy_or_specialization":true}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUM_LIT','rdc-hum-lit','Littéraire','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_GENERAL'),120,true,true,'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_LATIN_PHILO','rdc-opt-latin-philo','Latin-Philosophie','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_LIT'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_LATIN_GREC','rdc-opt-latin-grec','Latin-Grec','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_LIT'),20,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUM_PED','rdc-hum-ped','Pédagogie / Humanités pédagogiques','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_GENERAL'),130,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_PED_GENERAL','rdc-opt-ped-general','Pédagogie générale','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_PED'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_NORMALE','rdc-opt-normale','Normale','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_PED'),20,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_ED_PHYSIQUE','rdc-opt-ed-physique','Éducation physique','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_PED'),30,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_IFME','rdc-opt-ifme','Formation aux métiers de l’enseignement (IFME)','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_PED'),40,true,true,'https://edu-nc.gouv.cd/programmes-nationaux','Parcours lié à la réforme de la formation initiale des enseignants.','{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUM_TECH','rdc-hum-tech','Humanités techniques','school','stream',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUMANITIES'),200,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_COMM','rdc-tech-comm','Commerciale et Gestion','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_TECH'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_COMM_GESTION','rdc-opt-comm-gestion','Commerciale et Gestion','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_TECH_COMM'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{"exam_code":"301"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_SECRET','rdc-tech-secret','Secrétariat-Administration','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_TECH'),20,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_SECRET_ADMIN','rdc-opt-secret-admin','Secrétariat-Administration','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_TECH_SECRET'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_INDUSTRY','rdc-tech-industry','Technique Industrielle','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_TECH'),30,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_ELECTRIC','rdc-tech-electric','Électricité','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_TECH_INDUSTRY'),10,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_ELECTRONIC','rdc-tech-electronic','Électronique','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_TECH_INDUSTRY'),20,true,true,'https://edu-nc.gouv.cd/wp-content/uploads/2023/06/ELECTRONIQUE.pdf',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_PETRO','rdc-tech-petro','Pétrochimie industrielle','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_TECH_INDUSTRY'),30,true,true,'https://edu-nc.gouv.cd/wp-content/uploads/2023/06/PETROCHIMIE.pdf',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_CONSTRUCTION','rdc-opt-construction','Construction','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_TECH_INDUSTRY'),40,true,true,'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download',NULL,'{"exam_code":"904"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_AGRI','rdc-tech-agri','Technique Agricole','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_TECH'),40,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_OPT_AGRICULTURE','rdc-opt-agriculture','Agriculture','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_TECH_AGRI'),10,true,true,'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download',NULL,'{"exam_code":"801"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_SOCIAL','rdc-tech-social','Technique Sociale','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_TECH'),50,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_IT','rdc-tech-it','Technique Informatique','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_TECH'),60,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_TECH_ART','rdc-tech-art','Technique Artistique','school','section',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_TECH'),70,true,true,'https://edu-nc.gouv.cd/programmes-nationaux',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_HUM_PRO','rdc-hum-pro','Humanités professionnelles','school','stream',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUMANITIES'),300,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRO_COUTURE','rdc-pro-couture','Coupe et Couture','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_PRO'),10,true,true,'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRO_GENERAL','rdc-pro-general','Technique Professionnelle','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_PRO'),20,true,true,'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_PRO_ARTS_METIERS','rdc-pro-arts-metiers','Arts & Métiers','school','option',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_HUM_PRO'),30,true,true,'https://edu-nc.gouv.cd/systeme-educatif',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_ESU','rdc-esu','Étudiants / Enseignement supérieur et universitaire','university','root',NULL,20,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_ESU_CYCLES','rdc-esu-cycles','Cycles LMD','university','group',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU'),10,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_L1','rdc-l1','Licence 1','university','cycle',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_CYCLES'),10,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_L2','rdc-l2','Licence 2','university','cycle',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_CYCLES'),20,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_L3','rdc-l3','Licence 3','university','cycle',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_CYCLES'),30,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_M1','rdc-m1','Master 1','university','cycle',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_CYCLES'),40,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_M2','rdc-m2','Master 2','university','cycle',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_CYCLES'),50,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_DOCTORATE','rdc-doctorate','Doctorat','university','cycle',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_CYCLES'),60,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('RDC_ESU_DOMAINS','rdc-esu-domains','Domaines officiels LMD','university','group',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU'),20,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_1','esu-domain-1','Sciences de l’Homme et de la Société','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),10,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_2','esu-domain-2','Sciences de la Santé','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),20,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_3','esu-domain-3','Sciences Économiques et de Gestion','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),30,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_4','esu-domain-4','Sciences et Technologie','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),40,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_5','esu-domain-5','Sciences Juridiques, Politiques et Administratives','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),50,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_6','esu-domain-6','Sciences Psychologiques et de l’Éducation','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),60,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_7','esu-domain-7','Sciences Agronomiques et Environnement','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),70,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_DOMAIN_8','esu-domain-8','Lettres, Langues et Arts','university','domain',(SELECT id FROM public.academic_taxonomies WHERE code='RDC_ESU_DOMAINS'),80,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_FIELD_10','esu-field-10','Théologie Protestante','university','field',(SELECT id FROM public.academic_taxonomies WHERE code='ESU_DOMAIN_1'),100,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere','Filière officielle RegESU destinée aux étudiants en théologie.','{"regesu_id":10,"featured":true}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_MENTION_37','esu-mention-37','Théologie Pastorale','university','mention',(SELECT id FROM public.academic_taxonomies WHERE code='ESU_FIELD_10'),10,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{"regesu_id":37,"cycle_id":1,"cycle":"Licence"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_MENTION_38','esu-mention-38','Exégèses et Théologies Bibliques : Ancien Testament','university','mention',(SELECT id FROM public.academic_taxonomies WHERE code='ESU_FIELD_10'),20,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{"regesu_id":38,"cycle_id":2,"cycle":"Master"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_MENTION_39','esu-mention-39','Exégèses et Théologies Bibliques : Nouveau Testament','university','mention',(SELECT id FROM public.academic_taxonomies WHERE code='ESU_FIELD_10'),30,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{"regesu_id":39,"cycle_id":2,"cycle":"Master"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_MENTION_40','esu-mention-40','Théologie systématique et éthique','university','mention',(SELECT id FROM public.academic_taxonomies WHERE code='ESU_FIELD_10'),40,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{"regesu_id":40,"cycle_id":2,"cycle":"Master"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_MENTION_41','esu-mention-41','Théologie Pastorale','university','mention',(SELECT id FROM public.academic_taxonomies WHERE code='ESU_FIELD_10'),50,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{"regesu_id":41,"cycle_id":2,"cycle":"Master"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

INSERT INTO public.academic_taxonomies
 (code,slug,name,audience,kind,parent_id,sort_order,is_active,is_official,source_url,description,metadata)
 VALUES ('ESU_MENTION_42','esu-mention-42','Histoire de l’Église','university','mention',(SELECT id FROM public.academic_taxonomies WHERE code='ESU_FIELD_10'),60,true,true,'https://regesu.minesursi.gouv.cd/lmd_filiere',NULL,'{"regesu_id":42,"cycle_id":2,"cycle":"Master"}'::jsonb)
 ON CONFLICT(code) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,audience=EXCLUDED.audience,kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
 sort_order=EXCLUDED.sort_order,is_active=true,is_official=true,source_url=EXCLUDED.source_url,description=EXCLUDED.description,
 metadata=EXCLUDED.metadata,updated_at=now();

COMMIT;