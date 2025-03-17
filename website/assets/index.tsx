import hero from "./hero.jpg";

const navItems = [
    {
        label: "UV Radiation",
        tabs: [{ label: "UV on Map", link: "/uvRadiation/uvMap" }],
    },
    { label: "Impacts of UV exposure" },
    {
        label: "UV Protection",
        tabs: [
            {
                label: "Sunscreen Reminder",
                link: "/uvProtection/sunscreenReminder",
            },
            {
                label: "Sunscreen Calculator",
                link: "/uvProtection/sunscreenCalculator",
            },
        ],
    },
    { label: "Sun Protection products" },
];
export { hero, navItems };
