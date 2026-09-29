<?php

return [
    'default_royalty_rate' => (float) env('AUTHOR_DEFAULT_ROYALTY_RATE', 0.70),
    'payout_delay_days' => (int) env('AUTHOR_PAYOUT_DELAY_DAYS', 30),
    'minimum_payout' => (float) env('AUTHOR_MINIMUM_PAYOUT', 10),
    'default_currency' => env('AUTHOR_DEFAULT_CURRENCY', 'USD'),

    'markets' => [
        'CD' => ['name' => 'RDC', 'currency' => 'CDF'],
        'CG' => ['name' => 'Congo-Brazzaville', 'currency' => 'XAF'],
        'RW' => ['name' => 'Rwanda', 'currency' => 'RWF'],
        'BI' => ['name' => 'Burundi', 'currency' => 'BIF'],
        'KE' => ['name' => 'Kenya', 'currency' => 'KES'],
        'UG' => ['name' => 'Ouganda', 'currency' => 'UGX'],
        'TZ' => ['name' => 'Tanzanie', 'currency' => 'TZS'],
        'ZM' => ['name' => 'Zambie', 'currency' => 'ZMW'],
        'AO' => ['name' => 'Angola', 'currency' => 'AOA'],
        'CM' => ['name' => 'Cameroun', 'currency' => 'XAF'],
        'CI' => ['name' => 'Côte d’Ivoire', 'currency' => 'XOF'],
        'SN' => ['name' => 'Sénégal', 'currency' => 'XOF'],
        'GH' => ['name' => 'Ghana', 'currency' => 'GHS'],
        'NG' => ['name' => 'Nigeria', 'currency' => 'NGN'],
        'ZA' => ['name' => 'Afrique du Sud', 'currency' => 'ZAR'],
    ],

    'payout_providers' => [
        'bank_transfer' => 'Virement bancaire',
        'mobile_money' => 'Mobile Money',
    ],

    'mobile_money_networks' => [
        'airtel_money' => 'Airtel Money',
        'mpesa' => 'M-Pesa',
        'orange_money' => 'Orange Money',
        'mtn_momo' => 'MTN MoMo',
        'other' => 'Autre réseau',
    ],
];
