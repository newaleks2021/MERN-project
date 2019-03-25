const generatePlans = () => ([
    {
        id: 1,
        name: 'Free trial',
        price: 0.00,
        currency: 'eur',
        max_tocs: 1,
        period: 30
    },
    {
        id: 2,
        name: 'Startup quarterly',
        price: 195.00,
        currency: 'eur',
        max_tocs: 1,
        period: 92
    },
    {
        id: 3,
        name: 'Startup yearly',
        price: 295.00,
        currency: 'eur',
        max_tocs: 1,
        period: 365
    },
    {
        id: 4,
        name: 'Medium quarterly',
        price: 500.00,
        currency: 'eur',
        max_tocs: 5,
        period: 92
    },
    {
        id: 5,
        name: 'Medium yearly',
        price: 650.00,
        currency: 'eur',
        max_tocs: 5,
        period: 365
    },
    {
        id: 6,
        name: 'Large',
        price: 975.00,
        currency: 'eur',
        max_tocs: 10,
        period: 365
    },
    {
        id: 7,
        name: 'XL',
        price: 1725.00,
        currency: 'eur',
        max_tocs: 20,
        period: 365
    }
]);

module.exports = generatePlans;

