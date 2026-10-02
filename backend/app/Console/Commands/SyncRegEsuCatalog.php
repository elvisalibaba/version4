<?php

namespace App\Console\Commands;

use App\Models\AcademicTaxonomy;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class SyncRegEsuCatalog extends Command
{
    protected $signature = 'education:sync-regesu {--dry-run : Analyse la source sans modifier la base}';
    protected $description = 'Synchronise les domaines, filières et mentions LMD depuis le répertoire officiel RegESU.';

    private const SOURCE_URL = 'https://regesu.minesursi.gouv.cd/lmd_filiere';

    public function handle(): int
    {
        $html = Http::timeout(45)
            ->retry(2, 1000)
            ->withHeaders(['User-Agent' => 'HolisticBooks-Education-Catalog/1.0'])
            ->get(self::SOURCE_URL)
            ->throw()
            ->body();

        $rows = $this->extractRows($html);
        if ($rows === []) {
            throw new RuntimeException('Aucune donnée LMD exploitable trouvée dans RegESU.');
        }

        $this->info(count($rows).' lignes RegESU détectées.');

        if ($this->option('dry-run')) {
            $this->table(
                ['Domaine', 'Filière', 'Mention', 'Cycle'],
                array_slice(array_map(fn (array $row) => [$row['domain'], $row['field'], $row['mention'], $row['cycle']], $rows), 0, 20),
            );

            return self::SUCCESS;
        }

        $root = AcademicTaxonomy::query()->where('code', 'RDC_ESU_DOMAINS')->firstOrFail();

        foreach ($rows as $row) {
            $domain = AcademicTaxonomy::query()->updateOrCreate(
                ['code' => 'ESU_DOMAIN_'.$row['domain_id']],
                [
                    'parent_id' => $root->id,
                    'audience' => 'university',
                    'kind' => 'domain',
                    'name' => $row['domain'],
                    'slug' => 'esu-domain-'.$row['domain_id'],
                    'is_active' => true,
                    'is_official' => true,
                    'source_url' => self::SOURCE_URL,
                    'sort_order' => $row['domain_id'] * 10,
                    'metadata' => ['regesu_id' => $row['domain_id']],
                ],
            );

            $field = AcademicTaxonomy::query()->updateOrCreate(
                ['code' => 'ESU_FIELD_'.$row['field_id']],
                [
                    'parent_id' => $domain->id,
                    'audience' => 'university',
                    'kind' => 'field',
                    'name' => $row['field'],
                    'slug' => 'esu-field-'.$row['field_id'].'-'.Str::slug($row['field']),
                    'is_active' => true,
                    'is_official' => true,
                    'source_url' => self::SOURCE_URL,
                    'sort_order' => $row['field_id'],
                    'metadata' => ['regesu_id' => $row['field_id']],
                ],
            );

            AcademicTaxonomy::query()->updateOrCreate(
                ['code' => 'ESU_MENTION_'.$row['mention_id']],
                [
                    'parent_id' => $field->id,
                    'audience' => 'university',
                    'kind' => 'mention',
                    'name' => $row['mention'],
                    'slug' => 'esu-mention-'.$row['mention_id'].'-'.Str::slug($row['mention']),
                    'is_active' => true,
                    'is_official' => true,
                    'source_url' => self::SOURCE_URL,
                    'sort_order' => $row['mention_id'],
                    'metadata' => [
                        'regesu_id' => $row['mention_id'],
                        'cycle_id' => $row['cycle_id'],
                        'cycle' => $row['cycle'],
                    ],
                ],
            );
        }

        $this->info('Synchronisation RegESU terminée.');

        return self::SUCCESS;
    }

    private function extractRows(string $html): array
    {
        preg_match_all('/<tr[^>]*>(.*?)<\/tr>/si', $html, $matches);
        $rows = [];

        foreach ($matches[1] ?? [] as $rowHtml) {
            preg_match_all('/<td[^>]*>(.*?)<\/td>/si', $rowHtml, $cells);
            $cells = array_map(
                fn (string $value): string => trim(html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8')),
                $cells[1] ?? [],
            );

            if (count($cells) < 8 || ! ctype_digit($cells[0]) || ! ctype_digit($cells[2]) || ! ctype_digit($cells[4]) || ! ctype_digit($cells[6])) {
                continue;
            }

            $rows[] = [
                'domain_id' => (int) $cells[0],
                'domain' => $cells[1],
                'field_id' => (int) $cells[2],
                'field' => $cells[3],
                'mention_id' => (int) $cells[4],
                'mention' => $cells[5],
                'cycle_id' => (int) $cells[6],
                'cycle' => $cells[7],
            ];
        }

        return $rows;
    }
}
