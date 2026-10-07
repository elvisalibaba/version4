<?php

return [
    'roles' => [
        'super_admin' => ['*'],
        'editorial_director' => [
            'catalog.manage', 'catalog.publish', 'editorial.review', 'rights.view',
            'authors.manage', 'analytics.view', 'audit.view',
        ],
        'editor' => [
            'catalog.manage', 'editorial.review', 'rights.view', 'authors.manage',
        ],
        'corrector' => [
            'catalog.view', 'editorial.review',
        ],
        'legal' => [
            'rights.manage', 'rights.view', 'editorial.review', 'audit.view',
        ],
        'finance' => [
            'finance.manage', 'commerce.manage', 'pricing.view', 'analytics.view', 'audit.view',
        ],
        'marketing' => [
            'marketing.manage', 'pricing.manage', 'catalog.view', 'analytics.view',
        ],
        'support' => [
            'support.manage', 'catalog.view', 'commerce.view', 'users.view',
        ],
        'analyst' => [
            'analytics.view', 'catalog.view', 'commerce.view', 'pricing.view',
        ],
    ],

    'permissions' => [
        'platform.manage' => 'Gérer la configuration technique (application mobile, versions)',
        'catalog.view' => 'Voir le catalogue',
        'catalog.manage' => 'Gérer le catalogue',
        'catalog.publish' => 'Publier des livres',
        'editorial.review' => 'Gérer les validations éditoriales et recours',
        'authors.manage' => 'Gérer les auteurs',
        'rights.view' => 'Consulter les contrats de droits',
        'rights.manage' => 'Gérer les contrats et licences',
        'marketing.manage' => 'Gérer promotions, publicité et mise en avant',
        'pricing.view' => 'Consulter les prix par marché',
        'pricing.manage' => 'Gérer les prix par marché',
        'commerce.view' => 'Consulter commandes et paiements',
        'commerce.manage' => 'Gérer commandes et opérations commerciales',
        'finance.manage' => 'Gérer royalties, versements et paiements',
        'users.view' => 'Consulter les utilisateurs',
        'users.manage' => 'Gérer utilisateurs et rôles internes',
        'support.manage' => 'Gérer le support et les dossiers clients',
        'analytics.view' => 'Consulter les indicateurs et rapports',
        'audit.view' => 'Consulter le journal d’audit',
    ],
];
