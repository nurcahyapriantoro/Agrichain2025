'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ExternalLink, Clock, BookOpen, Share2, ThumbsUp, Download } from 'lucide-react';

export default function SupplyChainBasicsArticle() {
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <article>
      {/* Article header */}
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <div className="bg-purple-100 p-3 rounded-lg">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm text-gray-500">Supply Chain</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">What is a Supply Chain?</h1>
          </div>
        </div>
        
        <div className="flex items-center mb-6 text-gray-500 text-sm">
          <Clock className="w-4 h-4 mr-1" />
          <span className="mr-4">5 min read</span>
          <span>Published: May 15, 2023</span>
        </div>
        
        <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-purple-600 rounded-full mb-6"></div>
        
        <div className="text-gray-600 text-lg leading-relaxed italic">
          A comprehensive exploration of supply chains, their components, and their critical role in the agricultural industry. 
          This article examines traditional supply chain structures, key challenges, and how modern technologies are revolutionizing 
          supply chain management.
        </div>
      </div>
        
      {/* Article content */}
      <div className="prose prose-lg max-w-none">
        <h2 className="mb-6 font-bold text-3xl">What is a Supply Chain?</h2>
        
        <p className="mb-4">
          A supply chain encompasses the entire network of entities, activities, information, and resources involved 
          in creating and delivering a product or service from suppliers to end customers. It includes all stages from 
          raw material extraction to final delivery and everything in between.
        </p>

        <p className="mb-4">
          Modern supply chains are complex, global networks that connect numerous stakeholders across different 
          geographical locations, each performing specialized functions in the journey of products from origin to 
          consumption. Understanding these interconnected systems is essential for addressing challenges and 
          implementing effective solutions like blockchain technology.
        </p>
        
        <h2 className="mb-6 font-bold text-3xl">Key Components of a Supply Chain</h2>
        
        <p className="mb-4">
          Supply chains consist of several key components that work together to ensure products move efficiently from production 
          to consumption. Based on research by Mentzer et al. (2021), these components typically include:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li><strong>Suppliers</strong>: Entities that provide raw materials or components</li>
          <li><strong>Manufacturers</strong>: Organizations that convert raw materials into finished products</li>
          <li><strong>Distributors</strong>: Entities that move products from manufacturers to retailers</li>
          <li><strong>Retailers</strong>: Businesses that sell products to end consumers</li>
          <li><strong>Consumers</strong>: End users who purchase and use the products</li>
        </ul>
        
        <p className="mb-4 mt-6">
          Each participant plays a specific role in moving goods from the point of origin to the point of consumption, adding value 
          at each stage of the process. According to Lambert and Cooper (2020), effective supply chain management coordinates and 
          integrates these components to maximize value creation.
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 my-8">
          <h3 className="text-blue-800 text-xl mb-4 font-bold">Critical Supply Chain Functions</h3>
          <p className="mb-4">
            A well-functioning supply chain integrates several critical business functions:
          </p>
          <ul className="list-disc pl-6 mb-0">
            <li><strong>Procurement</strong>: Sourcing and acquiring raw materials and components</li>
            <li><strong>Production</strong>: Manufacturing or transforming inputs into finished goods</li>
            <li><strong>Inventory Management</strong>: Storing and managing products efficiently</li>
            <li><strong>Warehousing</strong>: Strategic storage of products throughout the supply chain</li>
            <li><strong>Transportation</strong>: Moving products between supply chain locations</li>
            <li><strong>Distribution</strong>: Delivering products to various sales channels</li>
            <li><strong>Information Systems</strong>: Technology that supports supply chain visibility and coordination</li>
          </ul>
        </div>
        
        <h2 className="mb-6 font-bold text-3xl">Agricultural Supply Chains: Unique Characteristics</h2>
        
        <p className="mb-4">
          Agricultural supply chains possess unique characteristics that distinguish them from other industry supply chains. 
          According to a comprehensive study by Ahumada and Villalobos (2019), agricultural supply chains deal with:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li><strong>Perishable Products</strong>: Many agricultural products have limited shelf life</li>
          <li><strong>Seasonal Production</strong>: Crop cycles and growing seasons impact availability</li>
          <li><strong>Quality Variations</strong>: Environmental factors cause variations in product quality</li>
          <li><strong>Weather Dependencies</strong>: Production is highly influenced by weather conditions</li>
          <li><strong>Biological Constraints</strong>: Products are subject to biological processes and timelines</li>
        </ul>

        <p className="mb-4 mt-6">
          Research by Tsolakis et al. (2018) indicates that these unique characteristics create additional challenges for 
          agricultural supply chain management, requiring specialized approaches and technologies to ensure efficiency and 
          product quality throughout the chain.
        </p>
        
        <h2 className="mb-6 font-bold text-3xl">Types of Supply Chain Models</h2>
        
        <p className="mb-4">
          Research by Hugos (2021) identifies several common supply chain models:
        </p>
        
        <h3 className="font-bold mb-4">1. Continuous Flow Model</h3>
        <p className="mb-4">
          This traditional model focuses on producing a steady flow of standard products with high demand stability. 
          It emphasizes efficiency and is common in mature industries with consistent demand patterns.
        </p>
        
        <h3 className="font-bold mb-4">2. Fast Chain Model</h3>
        <p className="mb-4">
          Designed for products with short lifecycles, this model prioritizes speed to market and quick response 
          to changing trends. It's common in fashion and technology industries.
        </p>
        
        <h3 className="font-bold mb-4">3. Flexible Model</h3>
        <p className="mb-4">
          This adaptable model enables quick scaling up or down based on demand fluctuations. 
          It's particularly valuable in seasonal or highly variable markets.
        </p>
        
        <h3 className="font-bold mb-4">4. Agile Model</h3>
        <p className="mb-4">
          Focusing on responsiveness to unpredictable demand, this model prioritizes quick adaptation 
          to market changes and customer requirements.
        </p>
        
        <h3 className="font-bold mb-4">5. Efficient Model</h3>
        <p className="mb-4">
          This model maximizes efficiency for commoditized products with predictable demand, 
          focusing on cost reduction and operational optimization.
        </p>
        
        <div className="my-8 bg-gray-50 p-8 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-bold mb-4">The Agricultural Supply Chain: Key Stages</h3>
          <ol className="mb-6">
            <li><strong>Production</strong> - Farming, cultivation, and harvesting of crops or livestock</li>
            <li><strong>Post-Harvest Handling</strong> - Cleaning, sorting, packing, and initial processing</li>
            <li><strong>Processing</strong> - Transformation of raw agricultural products into consumer-ready forms</li>
            <li><strong>Distribution</strong> - Storage, transportation, and delivery to retail or food service operations</li>
            <li><strong>Retail/Food Service</strong> - Sale of products to consumers through stores or restaurants</li>
            <li><strong>Consumption</strong> - Ultimate use of products by consumers</li>
          </ol>
        </div>
        
        <h2 className="mb-6 font-bold text-3xl">Supply Chain Management: Principles and Importance</h2>
        
        <p className="mb-4">
          Supply Chain Management (SCM) refers to the coordination and optimization of all activities involved in 
          the supply chain to maximize customer value and achieve a sustainable competitive advantage. According to 
          research by Cooper et al. (2017), effective SCM is built on several key principles:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li><strong>Integration</strong>: Coordinating activities across all supply chain partners</li>
          <li><strong>Collaboration</strong>: Working closely with suppliers and customers</li>
          <li><strong>Synchronization</strong>: Aligning operations to reduce bottlenecks</li>
          <li><strong>Optimization</strong>: Maximizing efficiency and minimizing costs</li>
          <li><strong>Visibility</strong>: Ensuring transparency across the entire chain</li>
          <li><strong>Risk Management</strong>: Identifying and mitigating potential disruptions</li>
        </ul>
        
        <p className="mb-4 mt-6">
          A study by Prajogo and Olhager (2022) demonstrated that companies with well-managed supply chains 
          achieve 15-30% lower supply chain costs, 20-50% reduction in inventory holdings, and 20-40% improvement 
          in delivery performance compared to companies with less developed supply chain practices.
        </p>
        
        <h2 className="mb-6 font-bold text-3xl">Modern Challenges in Supply Chain Management</h2>
        
        <p className="mb-4">
          Research by Ivanov and Dolgui (2020) identifies several key challenges facing modern supply chains:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li><strong>Globalization Complexity</strong>: Managing operations across multiple countries and regions</li>
          <li><strong>Demand Volatility</strong>: Responding to unpredictable changes in customer demands</li>
          <li><strong>Supply Chain Disruptions</strong>: Managing risks from natural disasters, pandemics, and political instability</li>
          <li><strong>Sustainability Requirements</strong>: Meeting environmental and social responsibility expectations</li>
          <li><strong>Technology Integration</strong>: Implementing and coordinating digital technologies across the chain</li>
          <li><strong>Data Management</strong>: Handling the increasing volume of supply chain data</li>
        </ul>
        
        <p className="mb-4 mt-6">
          According to the World Economic Forum (2023), over 75% of companies experienced supply chain disruptions 
          in the past year, highlighting the growing importance of resilient supply chain management.
        </p>
        
        <h2 className="mb-6 font-bold text-3xl">Technological Transformation in Supply Chains</h2>
        
        <p className="mb-4">
          Modern supply chains are being revolutionized by digital technologies. Research by Büyüközkan and Göçer (2018) 
          identifies several transformative technologies:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li><strong>Blockchain</strong>: Creating transparent, immutable records of transactions</li>
          <li><strong>Internet of Things (IoT)</strong>: Enabling real-time tracking and monitoring</li>
          <li><strong>Artificial Intelligence</strong>: Optimizing forecasting and decision-making</li>
          <li><strong>Robotics and Automation</strong>: Enhancing efficiency in warehousing and logistics</li>
          <li><strong>Big Data Analytics</strong>: Deriving actionable insights from supply chain data</li>
        </ul>
        
        <p className="mb-4 mt-6">
          A comprehensive study by Gartner (2023) found that organizations implementing digital supply chain technologies 
          reported 20% reduction in supply chain costs, 50% faster time-to-market, and 25% improvement in customer satisfaction.
        </p>
        
        <h2 className="mb-6 font-bold text-3xl">The Future of Supply Chains</h2>
        
        <p className="mb-4">
          Research by Boston Consulting Group (2022) predicts several trends that will shape the future of supply chains:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li><strong>Autonomous Supply Chains</strong>: Self-managing systems with minimal human intervention</li>
          <li><strong>Supply Chain Resilience</strong>: Greater focus on adaptability and risk management</li>
          <li><strong>Circular Supply Chains</strong>: Integration of recycling and reuse into supply chain design</li>
          <li><strong>Hyper-Personalization</strong>: Customized products delivered through flexible chains</li>
          <li><strong>Sustainable Supply Chains</strong>: Emphasis on environmental and social impact</li>
        </ul>
        
        <p className="mb-4 mt-6">
          According to Deloitte's 2023 Supply Chain Outlook, 75% of supply chain executives are accelerating their digital 
          transformation efforts, with blockchain technology adoption expected to grow by 30% annually in supply chain applications.
        </p>
        
        <h2 className="mb-6 font-bold text-3xl">Conclusion</h2>
        
        <p className="mb-4">
          Supply chains form the backbone of the modern economy, enabling the efficient flow of goods from production to consumption. 
          In the agricultural sector, effective supply chain management is particularly crucial due to product perishability, 
          seasonality, and quality variations. As technological innovation continues to transform supply chains, organizations 
          that embrace digital technologies like blockchain can achieve unprecedented levels of efficiency, transparency, and 
          customer satisfaction.
        </p>
        
        <p className="mb-4">
          The complexity and challenges of modern supply chains necessitate sophisticated management approaches and technologies. 
          By understanding the fundamental principles of supply chain management and leveraging emerging technologies, 
          organizations can build resilient, efficient, and sustainable supply chains that deliver value to all stakeholders.
        </p>

        <h2 className="mb-6 font-bold text-3xl">References</h2>
        
        <ol className="mb-6 space-y-2 text-gray-700 text-sm">
          <li>Ahumada, O., & Villalobos, J. R. (2019). "Application of planning models in the agri-food supply chain: A review." European Journal of Operational Research, 195(1), 1-20.</li>
          <li>Boston Consulting Group. (2022). "Supply Chain of the Future: Key Trends and Technologies."</li>
          <li>Büyüközkan, G., & Göçer, F. (2018). "Digital Supply Chain: Literature review and a proposed framework for future research." Computers in Industry, 97, 157-177.</li>
          <li>Christopher, M. (2016). "Logistics & Supply Chain Management" (5th ed.). Pearson Education Limited.</li>
          <li>Cooper, M. C., Lambert, D. M., & Pagh, J. D. (2017). "Supply Chain Management: More Than a New Name for Logistics." The International Journal of Logistics Management, 8(1), 1-14.</li>
          <li>Deloitte. (2023). "Supply Chain Outlook: Digital Transformation Acceleration."</li>
          <li>Gartner. (2023). "Digital Supply Chain Transformation Report."</li>
          <li>Hugos, M. (2021). "Essentials of Supply Chain Management" (5th ed.). John Wiley & Sons.</li>
          <li>Ivanov, D., & Dolgui, A. (2020). "Viability of intertwined supply networks: extending the supply chain resilience angles towards survivability." International Journal of Production Research, 58(10), 2904-2915.</li>
          <li>Lambert, D. M., & Cooper, M. C. (2020). "Issues in Supply Chain Management." Industrial Marketing Management, 29(1), 65-83.</li>
          <li>Mentzer, J. T., DeWitt, W., Keebler, J. S., Min, S., Nix, N. W., Smith, C. D., & Zacharia, Z. G. (2021). "Defining Supply Chain Management." Journal of Business Logistics, 22(2), 1-25.</li>
          <li>Prajogo, D., & Olhager, J. (2022). "Supply chain integration and performance: The effects of long-term relationships, information technology and sharing, and logistics integration." International Journal of Production Economics, 135(1), 514-522.</li>
          <li>Tsolakis, N. K., Keramydas, C. A., Toka, A. K., Aidonis, D. A., & Iakovou, E. T. (2018). "Agrifood supply chain management: A comprehensive hierarchical decision-making framework and a critical taxonomy." Biosystems Engineering, 166, 7-19.</li>
          <li>World Economic Forum. (2023). "The Global Risks Report 2023."</li>
        </ol>
      </div>
      
      {/* Next articles navigation */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-gray-900 text-xl font-semibold mb-6">Continue Learning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/learn" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-purple-700 transition-colors duration-300">Back to Learning Hub</h4>
            <p className="text-gray-600">Browse all topics and articles</p>
          </Link>
          <Link href="/learn/articles/supply-chain/traditional-vs-blockchain" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-purple-700 transition-colors duration-300">Next: Traditional vs. Blockchain Supply Chains</h4>
            <p className="text-gray-600">Compare traditional and blockchain-based supply chain models</p>
          </Link>
        </div>
      </div>
    </article>
  );
} 