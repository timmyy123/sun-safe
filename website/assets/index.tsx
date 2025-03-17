import hero from "./hero.jpg";

const navItems = [
// <<<<<<< HEAD
//   { label: "UV Radiation", tabs: [{label: 'UV on Map', link:'/uvRadiation/uvMap'}] },
//   { label: "Impacts of UV exposure", tabs:[{label: 'Skin Cancer', link:'/uvImpacts/cancer'},{label:'UV map per state', link:'/uvImpacts/uvByState'}] },
//   { label: "UV Protection", tabs: [{label: 'Sunscreen Reminder', link:'/uvProtection/sunscreenReminder'}] },
//   { label: "Sun Protection products" },
// =======
    {
        label: "UV Radiation",
        tabs: [{ label: "UV on Map", link: "/uvRadiation/uvMap" }],
    },
    { label: "Impacts of UV exposure", tabs:[{label: 'Skin Cancer', link:'/uvImpacts/cancer'},{label:'UV map per state', link:'/uvImpacts/uvByState'}] },
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
>>>>>>> 9dc755f35b6557ce0eba255042f8c5f396da3889
];

const australiaStates = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "NSW", "fullName": "New South Wales" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [141.0, -28.9], [149.9, -28.9], [153.6, -37.5],
          [149.9, -37.5], [141.0, -34.0], [141.0, -28.9]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "QLD", "fullName": "Queensland" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [138.0, -10.6], [153.6, -10.6], [153.6, -28.9],
          [141.0, -28.9], [138.0, -26.0], [138.0, -10.6]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "VIC", "fullName": "Victoria" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [141.0, -34.0], [149.9, -37.5], [146.0, -39.2],
          [140.9, -38.0], [141.0, -34.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "SA", "fullName": "South Australia" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [129.0, -26.0], [141.0, -26.0], [141.0, -34.0],
          [140.9, -38.0], [129.0, -31.5], [129.0, -26.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "WA", "fullName": "Western Australia" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [113.0, -14.0], [129.0, -14.0], [129.0, -31.5],
          [115.0, -35.0], [113.0, -27.5], [113.0, -14.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "NT", "fullName": "Northern Territory" },
      "geometry": {
        "type": "Polygon", 
        "coordinates": [[
          [129.0, -11.0], [138.0, -11.0], [138.0, -26.0],
          [129.0, -26.0], [129.0, -11.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "TAS", "fullName": "Tasmania" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [144.0, -40.0], [148.5, -40.0], [148.5, -43.5],
          [144.0, -43.5], [144.0, -40.0]
        ]]
      }
    },
    {
      "type": "Feature", 
      "properties": { "name": "ACT", "fullName": "Australian Capital Territory" },
      "geometry": {
        "type": "Point",
        "coordinates": [149.13, -35.28]
      }
    }
  ]
};
export { hero, navItems, australiaStates };
