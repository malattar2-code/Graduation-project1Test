const fs = require("fs");
const lines = fs.readFileSync("cities5000.txt", "utf8").split("\n");

const cities = lines.map(line => {
  const parts = line.split("\t");
  return {
    name: parts[1],
    lat: parseFloat(parts[4]),
    lng: parseFloat(parts[5])
  };
}).filter(city => city.lat && city.lng);

fs.writeFileSync("geonames.json", JSON.stringify(cities, null, 2));

console.log("تم إنشاء geonames.json بنجاح ✅");
