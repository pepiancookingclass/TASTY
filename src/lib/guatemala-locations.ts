
export type Municipality = {
  name: string;
  hasDelivery: boolean;
};

export type Department = {
  name: string;
  municipalities: Municipality[];
};

export const departments: Department[] = [
  {
    name: "Guatemala",
    municipalities: [
      { name: "Guatemala", hasDelivery: true },
      { name: "Santa Catarina Pinula", hasDelivery: true },
      { name: "San José Pinula", hasDelivery: false },
      { name: "San José del Golfo", hasDelivery: false },
      { name: "Palencia", hasDelivery: false },
      { name: "Chinautla", hasDelivery: false },
      { name: "San Pedro Ayampuc", hasDelivery: false },
      { name: "Mixco", hasDelivery: true },
      { name: "San Pedro Sacatepéquez", hasDelivery: false },
      { name: "San Juan Sacatepéquez", hasDelivery: false },
      { name: "San Raymundo", hasDelivery: false },
      { name: "Chuarrancho", hasDelivery: false },
      { name: "Fraijanes", hasDelivery: false },
      { name: "Amatitlán", hasDelivery: false },
      { name: "Villa Nueva", hasDelivery: true },
      { name: "Villa Canales", hasDelivery: false },
      { name: "San Miguel Petapa", hasDelivery: true },
    ],
  },
  {
    name: "Sacatepéquez",
    municipalities: [
        { name: "Antigua Guatemala", hasDelivery: true },
        { name: "Jocotenango", hasDelivery: true },
        { name: "Pastores", hasDelivery: false },
        { name: "Sumpango", hasDelivery: false },
        { name: "Santo Domingo Xenacoj", hasDelivery: false },
        { name: "Santiago Sacatepéquez", hasDelivery: false },
        { name: "San Bartolomé Milpas Altas", hasDelivery: false },
        { name: "San Lucas Sacatepéquez", hasDelivery: true },
        { name: "Santa Lucía Milpas Altas", hasDelivery: false },
        { name: "Magdalena Milpas Altas", hasDelivery: false },
        { name: "Santa María de Jesús", hasDelivery: false },
        { name: "Ciudad Vieja", hasDelivery: true },
        { name: "San Miguel Dueñas", hasDelivery: false },
        { name: "Alotenango", hasDelivery: false },
        { name: "San Antonio Aguas Calientes", hasDelivery: false },
        { name: "Santa Catarina Barahona", hasDelivery: false },
    ]
  },
  {
      name: "Quetzaltenango",
      municipalities: [
        { name: "Quetzaltenango", hasDelivery: true },
        { name: "Salcajá", hasDelivery: true },
        { name: "Olintepeque", hasDelivery: false },
        { name: "San Carlos Sija", hasDelivery: false },
        { name: "Sibilia", hasDelivery: false },
        { name: "Cabricán", hasDelivery: false },
        { name: "Cajolá", hasDelivery: false },
        { name: "San Miguel Sigüilá", hasDelivery: false },
        { name: "Ostuncalco", hasDelivery: false },
        { name: "San Mateo", hasDelivery: false },
        { name: "Concepción Chiquirichapa", hasDelivery: false },
        { name: "San Martín Sacatepéquez", hasDelivery: false },
        { name: "Almolonga", hasDelivery: false },
        { name: "Cantel", hasDelivery: false },
        { name: "Huitán", hasDelivery: false },
        { name: "Zunil", hasDelivery: false },
        { name: "Colomba", hasDelivery: false },
        { name: "San Francisco La Unión", hasDelivery: false },
        { name: "El Palmar", hasDelivery: false },
        { name: "Coatepeque", hasDelivery: false },
        { name: "Génova", hasDelivery: false },
        { name: "Flores Costa Cuca", hasDelivery: false },
        { name: "La Esperanza", hasDelivery: false },
        { name: "Palestina de Los Altos", hasDelivery: false },
      ]
  },
  // Add other departments if needed
];
