<?php

namespace App\Filament\Resources\AuditEvents;

use App\Filament\Resources\AuditEvents\Pages\ListPlatformAuditEvents;
use App\Models\PlatformAuditEvent;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class PlatformAuditEventResource extends Resource
{
    protected static ?string $model = PlatformAuditEvent::class;
    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-clipboard-document-check';
    protected static ?string $navigationLabel = 'Journal d’audit';
    protected static ?string $modelLabel = 'événement d’audit';
    protected static ?string $pluralModelLabel = 'journal d’audit';
    protected static ?int $navigationSort = 90;

    public static function getNavigationGroup(): ?string
    {
        return 'Gouvernance';
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit($record): bool
    {
        return false;
    }

    public static function canDelete($record): bool
    {
        return false;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('occurred_at', 'desc')
            ->columns([
                TextColumn::make('occurred_at')->label('Date')->dateTime('d/m/Y H:i:s')->sortable(),
                TextColumn::make('action')->label('Action')->badge()->searchable(),
                TextColumn::make('severity')->label('Niveau')->badge(),
                TextColumn::make('actor.name')->label('Acteur')->placeholder('Système')->searchable(),
                TextColumn::make('entity_type')->label('Objet')->formatStateUsing(fn ($state) => $state ? class_basename($state) : '—'),
                TextColumn::make('entity_id')->label('ID')->limit(14)->toggleable(),
                TextColumn::make('summary')->label('Résumé')->wrap()->limit(100),
            ])
            ->filters([
                SelectFilter::make('severity')->options([
                    'info' => 'Information',
                    'warning' => 'Avertissement',
                    'critical' => 'Critique',
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListPlatformAuditEvents::route('/'),
        ];
    }
}
