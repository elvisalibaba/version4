<?php

namespace Tests\Feature\Api\V1;

use App\Models\AcademicTaxonomy;
use App\Models\Book;
use Database\Seeders\RdcEducationCatalogSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class EducationCatalogControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_catalog_exposes_rdc_school_and_university_structure(): void
    {
        $this->seed(RdcEducationCatalogSeeder::class);

        $this->getJson('/api/v1/education/catalog')
            ->assertOk()
            ->assertJsonFragment(['code' => 'RDC_PRIMARY', 'name' => 'Primaire'])
            ->assertJsonFragment(['code' => 'RDC_CTEB'])
            ->assertJsonFragment(['code' => 'RDC_HUMANITIES', 'name' => 'Humanités'])
            ->assertJsonFragment(['code' => 'ESU_DOMAIN_4', 'name' => 'Sciences et Technologie']);

        $this->assertSame(
            8,
            AcademicTaxonomy::query()->where('kind', 'domain')->where('is_official', true)->count(),
        );
    }

    public function test_books_can_be_filtered_by_academic_taxonomy(): void
    {
        $this->seed(RdcEducationCatalogSeeder::class);

        $primaryFive = AcademicTaxonomy::query()->where('code', 'RDC_PRIMARY_5')->firstOrFail();

        $target = Book::factory()->create(['title' => 'Mathématiques cinquième primaire']);
        $target->educationTaxonomies()->attach($primaryFive);

        Book::factory()->create(['title' => 'Roman sans classement scolaire']);

        $this->getJson('/api/v1/books?education='.$primaryFive->slug)
            ->assertOk()
            ->assertJsonFragment(['id' => $target->id, 'title' => 'Mathématiques cinquième primaire'])
            ->assertJsonMissing(['title' => 'Roman sans classement scolaire']);
    }

    public function test_books_can_be_filtered_by_student_audience(): void
    {
        $this->seed(RdcEducationCatalogSeeder::class);

        $schoolNode = AcademicTaxonomy::query()->where('code', 'RDC_PRIMARY_1')->firstOrFail();
        $universityNode = AcademicTaxonomy::query()->where('code', 'ESU_DOMAIN_4')->firstOrFail();

        $schoolBook = Book::factory()->create(['title' => 'Lecture première primaire']);
        $schoolBook->educationTaxonomies()->attach($schoolNode);

        $universityBook = Book::factory()->create(['title' => 'Systèmes informatiques universitaires']);
        $universityBook->educationTaxonomies()->attach($universityNode);

        $this->getJson('/api/v1/books?education_audience=university')
            ->assertOk()
            ->assertJsonFragment(['title' => 'Systèmes informatiques universitaires'])
            ->assertJsonMissing(['title' => 'Lecture première primaire']);
    }
}
