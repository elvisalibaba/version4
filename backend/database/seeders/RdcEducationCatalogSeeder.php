<?php

namespace Database\Seeders;

use App\Models\AcademicTaxonomy;
use Illuminate\Database\Seeder;

class RdcEducationCatalogSeeder extends Seeder
{
    private const EDU_SOURCE = 'https://edu-nc.gouv.cd/systeme-educatif';
    private const PROGRAMMES_SOURCE = 'https://edu-nc.gouv.cd/programmes-nationaux';
    private const SECONDARY_SOURCE = 'https://edu-nc.gouv.cd/documentation/offre-educative-au-secondaire-en-rdc-rapport-de-la-geolocalisation-des-ecoles-secondaires-juillet-2019/download';
    private const ESU_SOURCE = 'https://regesu.minesursi.gouv.cd/lmd_filiere';

    public function run(): void
    {
        $this->seedSchool();
        $this->seedUniversity();
    }

    private function node(
        string $code,
        string $name,
        string $audience,
        string $kind,
        ?AcademicTaxonomy $parent = null,
        int $sortOrder = 0,
        ?string $sourceUrl = null,
        ?string $description = null,
        array $metadata = [],
    ): AcademicTaxonomy {
        return AcademicTaxonomy::query()->updateOrCreate(
            ['code' => $code],
            [
                'parent_id' => $parent?->id,
                'audience' => $audience,
                'kind' => $kind,
                'name' => $name,
                'slug' => strtolower(str_replace('_', '-', $code)),
                'description' => $description,
                'sort_order' => $sortOrder,
                'is_active' => true,
                'is_official' => true,
                'source_url' => $sourceUrl,
                'metadata' => $metadata,
            ],
        );
    }

    private function seedSchool(): void
    {
        $school = $this->node('RDC_SCHOOL', 'Élèves', 'school', 'root', null, 10, self::EDU_SOURCE);

        $preschool = $this->node('RDC_PRESCHOOL', 'Préscolaire', 'school', 'level', $school, 10, self::EDU_SOURCE);
        foreach ([1, 2, 3] as $year) {
            $this->node("RDC_PRESCHOOL_{$year}", "{$year}e année préscolaire", 'school', 'class', $preschool, $year * 10, self::EDU_SOURCE);
        }

        $primary = $this->node('RDC_PRIMARY', 'Primaire', 'school', 'level', $school, 20, self::EDU_SOURCE);
        foreach (range(1, 6) as $year) {
            $this->node("RDC_PRIMARY_{$year}", "{$year}e année primaire", 'school', 'class', $primary, $year * 10, self::PROGRAMMES_SOURCE);
        }

        $cteb = $this->node(
            'RDC_CTEB',
            'Cycle Terminal de l’Éducation de Base (CTEB)',
            'school',
            'level',
            $school,
            30,
            self::EDU_SOURCE,
            'Cycle de deux ans correspondant aux 7e et 8e années de l’Éducation de Base.',
        );
        $this->node('RDC_CTEB_7', '7e année de l’Éducation de Base', 'school', 'class', $cteb, 10, self::PROGRAMMES_SOURCE);
        $this->node('RDC_CTEB_8', '8e année de l’Éducation de Base', 'school', 'class', $cteb, 20, self::PROGRAMMES_SOURCE);

        $humanities = $this->node('RDC_HUMANITIES', 'Humanités', 'school', 'level', $school, 40, self::EDU_SOURCE);
        foreach (range(1, 4) as $year) {
            $this->node("RDC_HUMANITIES_{$year}", "{$year}e année des Humanités", 'school', 'class', $humanities, $year * 10, self::EDU_SOURCE);
        }

        $general = $this->node('RDC_HUM_GENERAL', 'Humanités générales', 'school', 'stream', $humanities, 100, self::EDU_SOURCE);
        $scientific = $this->node('RDC_HUM_SCI', 'Humanités scientifiques', 'school', 'section', $general, 110, self::PROGRAMMES_SOURCE, 'Voie scientifique rénovée.');
        $this->node('RDC_OPT_MATH_PHYS', 'Mathématique-Physique', 'school', 'option', $scientific, 10, self::SECONDARY_SOURCE, null, ['legacy_or_specialization' => true]);
        $this->node('RDC_OPT_BIO_CHIMIE', 'Bio-Chimie', 'school', 'option', $scientific, 20, self::SECONDARY_SOURCE, null, ['legacy_or_specialization' => true]);

        $literary = $this->node('RDC_HUM_LIT', 'Littéraire', 'school', 'section', $general, 120, self::SECONDARY_SOURCE);
        $this->node('RDC_OPT_LATIN_PHILO', 'Latin-Philosophie', 'school', 'option', $literary, 10, self::PROGRAMMES_SOURCE);
        $this->node('RDC_OPT_LATIN_GREC', 'Latin-Grec', 'school', 'option', $literary, 20, self::PROGRAMMES_SOURCE);

        $pedagogy = $this->node('RDC_HUM_PED', 'Pédagogie / Humanités pédagogiques', 'school', 'section', $general, 130, self::PROGRAMMES_SOURCE);
        $this->node('RDC_OPT_PED_GENERAL', 'Pédagogie générale', 'school', 'option', $pedagogy, 10, self::PROGRAMMES_SOURCE);
        $this->node('RDC_OPT_NORMALE', 'Normale', 'school', 'option', $pedagogy, 20, self::PROGRAMMES_SOURCE);
        $this->node('RDC_OPT_ED_PHYSIQUE', 'Éducation physique', 'school', 'option', $pedagogy, 30, self::PROGRAMMES_SOURCE);
        $this->node('RDC_OPT_IFME', 'Formation aux métiers de l’enseignement (IFME)', 'school', 'option', $pedagogy, 40, self::PROGRAMMES_SOURCE, 'Parcours lié à la réforme de la formation initiale des enseignants.');

        $technical = $this->node('RDC_HUM_TECH', 'Humanités techniques', 'school', 'stream', $humanities, 200, self::EDU_SOURCE);
        $technicalSections = [
            ['RDC_TECH_COMM', 'Commerciale et Gestion'],
            ['RDC_TECH_SECRET', 'Secrétariat-Administration'],
            ['RDC_TECH_INDUSTRY', 'Technique Industrielle'],
            ['RDC_TECH_AGRI', 'Technique Agricole'],
            ['RDC_TECH_SOCIAL', 'Technique Sociale'],
            ['RDC_TECH_IT', 'Technique Informatique'],
            ['RDC_TECH_ART', 'Technique Artistique'],
            ['RDC_TECH_ELECTRIC', 'Électricité'],
            ['RDC_TECH_ELECTRONIC', 'Électronique'],
            ['RDC_TECH_PETRO', 'Pétrochimie'],
        ];
        foreach ($technicalSections as $index => [$code, $name]) {
            $this->node($code, $name, 'school', 'section', $technical, ($index + 1) * 10, self::PROGRAMMES_SOURCE);
        }

        $professional = $this->node('RDC_HUM_PRO', 'Humanités professionnelles', 'school', 'stream', $humanities, 300, self::EDU_SOURCE);
        $this->node('RDC_PRO_COUTURE', 'Coupe et Couture', 'school', 'option', $professional, 10, self::SECONDARY_SOURCE);
        $this->node('RDC_PRO_GENERAL', 'Technique Professionnelle', 'school', 'option', $professional, 20, self::SECONDARY_SOURCE);
        $this->node('RDC_PRO_ARTS_METIERS', 'Arts & Métiers', 'school', 'option', $professional, 30, self::EDU_SOURCE);
    }

    private function seedUniversity(): void
    {
        $university = $this->node('RDC_ESU', 'Étudiants / Enseignement supérieur et universitaire', 'university', 'root', null, 20, self::ESU_SOURCE);

        $cycles = $this->node('RDC_ESU_CYCLES', 'Cycles LMD', 'university', 'group', $university, 10, self::ESU_SOURCE);
        foreach ([
            ['RDC_L1', 'Licence 1', 10],
            ['RDC_L2', 'Licence 2', 20],
            ['RDC_L3', 'Licence 3', 30],
            ['RDC_M1', 'Master 1', 40],
            ['RDC_M2', 'Master 2', 50],
            ['RDC_DOCTORATE', 'Doctorat', 60],
        ] as [$code, $name, $sort]) {
            $this->node($code, $name, 'university', 'cycle', $cycles, $sort, self::ESU_SOURCE);
        }

        $domains = $this->node('RDC_ESU_DOMAINS', 'Domaines officiels LMD', 'university', 'group', $university, 20, self::ESU_SOURCE);
        foreach ([
            ['ESU_DOMAIN_1', 'Sciences de l’Homme et de la Société', 10],
            ['ESU_DOMAIN_2', 'Sciences de la Santé', 20],
            ['ESU_DOMAIN_3', 'Sciences Économiques et de Gestion', 30],
            ['ESU_DOMAIN_4', 'Sciences et Technologie', 40],
            ['ESU_DOMAIN_5', 'Sciences Juridiques, Politiques et Administratives', 50],
            ['ESU_DOMAIN_6', 'Sciences Psychologiques et de l’Éducation', 60],
            ['ESU_DOMAIN_7', 'Sciences Agronomiques et Environnement', 70],
            ['ESU_DOMAIN_8', 'Lettres, Langues et Arts', 80],
        ] as [$code, $name, $sort]) {
            $this->node($code, $name, 'university', 'domain', $domains, $sort, self::ESU_SOURCE);
        }
    }
}
