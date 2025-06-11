export interface Product {
  id?: string;
  _id?: string;
  productId?: string;
  product_id?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  year: number;
  image: string;
  cities: string;
  phone?: string;
  email?: string;
  
  // გამყიდველის/მომხმარებლის ინფორმაცია
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  
  // სხვადასხვა API სტრუქტურის მხარდაჭერა
  user?: {
    name?: string;
    firstName?: string;
    email?: string;
    phone?: string;
  };
  
  seller?: {
    name?: string;
    firstName?: string;
    email?: string;
    phone?: string;
  };
  
  owner?: {
    name?: string;
    firstName?: string;
    email?: string;
    phone?: string;
  };
  
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  
  // API პასუხის დამატებითი მეტა-ინფორმაცია
  createdAt?: string;
  updatedAt?: string;
}