const storeData = [
  {
    name: "VegNonVeg",
    store_link: "https://www.vegnonveg.com/",
    store_logo: "/assets/logo_vegnonveg.png",
  },
  {
    name: "SuperKicks",
    store_link: "https://www.superkicks.in/",
    store_logo: "/assets/logo_superkicks.png",
  },
  {
    name: "Limited Edition",
    store_link: "https://limitededt.in/",
    store_logo: "/assets/logo_limitededt.png",
  },
];

export const getStoreData = (name) => {
  return storeData.find((data) => data.name === name);
};
