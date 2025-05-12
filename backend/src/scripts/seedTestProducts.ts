import { txhashDB } from "../helper/level.db.client";
import { ProductStatus } from "../enum";

async function seedTestProducts() {
  console.log("Seeding test products...");

  try {
    // Create a few test products
    const products = [
      {
        id: `prod-${Date.now()}-1`,
        name: "Test Apple",
        description: "Fresh apples from the farm",
        price: 25000,
        quantity: 100,
        status: ProductStatus.CREATED,
        ownerId: "FARM-12345",
        ownerName: "Test Farmer",
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: `prod-${Date.now()}-2`,
        name: "Test Orange",
        description: "Sweet oranges",
        price: 30000,
        quantity: 50,
        status: ProductStatus.CREATED,
        ownerId: "FARM-12345",
        ownerName: "Test Farmer",
        createdAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
        updatedAt: Date.now() - 1000 * 60 * 60
      },
      {
        id: `prod-${Date.now()}-3`,
        name: "Test Banana",
        description: "Ripe bananas",
        price: 15000,
        quantity: 200,
        status: ProductStatus.TRANSFERRED,
        ownerId: "DIST-54321",
        ownerName: "Test Distributor",
        createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        updatedAt: Date.now() - 1000 * 60 * 60 * 2 // 2 hours ago
      }
    ];

    // Store each product in the database
    for (const product of products) {
      await txhashDB.put(`product:${product.id}`, JSON.stringify(product));
      console.log(`Added product: ${product.name} (${product.id})`);
    }

    console.log("Successfully seeded test products!");

    // Verify products exist in database
    const allKeys = await txhashDB.keys().all();
    const productKeys = allKeys.filter(key => key.toString().startsWith('product:'));
    console.log(`Total product keys in database: ${productKeys.length}`);
    
    // List all product keys
    console.log("Product keys in database:");
    for (const key of productKeys) {
      console.log(` - ${key}`);
      const product = JSON.parse(await txhashDB.get(key));
      console.log(`   Name: ${product.name}, Status: ${product.status}`);
    }
  } catch (error) {
    console.error("Error seeding test products:", error);
  }
}

// Run the seeding function
seedTestProducts().then(() => {
  console.log("Seeding process completed.");
}).catch(err => {
  console.error("Fatal error in seeding process:", err);
}); 