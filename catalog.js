// ══════════════════════════════════════════════════════
//  CATALOGUE PRODUITS — ~450 produits, 8 catégories
// ══════════════════════════════════════════════════════
const PRODUCT_CATALOG = {
  "Fruits & Légumes": [
    "Pomme Golden","Pomme Granny Smith","Pomme Gala","Pomme Pink Lady","Poire",
    "Banane","Orange","Clémentine","Mandarine","Pamplemousse","Citron","Citron vert",
    "Kiwi","Ananas","Mangue","Avocat","Fraise","Framboise","Myrtille","Mûre",
    "Cerise","Pêche","Nectarine","Abricot","Prune","Raisin blanc","Raisin noir",
    "Melon","Pastèque","Figue","Grenade","Litchi","Fruit de la passion","Datte",
    "Pruneau","Noix de coco","Rhubarbe","Kaki","Coing",
    "Tomate","Tomate cerise","Concombre","Salade verte","Laitue","Roquette","Mâche",
    "Épinard","Courgette","Aubergine","Poivron rouge","Poivron vert","Poivron jaune",
    "Carotte","Pomme de terre","Patate douce","Oignon","Échalote","Ail","Poireau",
    "Brocoli","Chou-fleur","Chou blanc","Chou rouge","Chou de Bruxelles","Chou kale",
    "Champignon de Paris","Champignon shiitake","Pleurote","Petit pois","Haricot vert",
    "Haricot blanc","Fève","Maïs","Radis","Betterave","Céleri branche","Céleri rave",
    "Fenouil","Artichaut","Asperge","Navet","Panais","Topinambour","Potiron",
    "Butternut","Citrouille","Cornichon","Persil","Basilic","Coriandre","Ciboulette",
    "Menthe","Thym","Romarin","Aneth","Estragon","Sauge","Laurier","Gingembre frais",
    "Piment","Piment d'Espelette","Igname","Manioc","Salsifis","Endive","Frisée",
    "Cresson","Pousse d'épinard","Pousse de soja","Germe de blé","Tomate séchée"
  ],
  "Viandes & Poissons": [
    "Poulet entier","Blanc de poulet","Cuisse de poulet","Pilon de poulet","Aile de poulet",
    "Escalope de poulet","Filet de dinde","Cuisse de dinde","Steak haché 5%","Steak haché 15%",
    "Steak de boeuf","Entrecôte","Faux-filet","Rumsteck","Bavette","Onglet","Paleron",
    "Pot-au-feu","Rôti de boeuf","Bourguignon","Côte de boeuf","Tartare de boeuf",
    "Côte de porc","Filet mignon de porc","Rôti de porc","Échine de porc","Travers de porc",
    "Lardons","Jambon blanc","Jambon cru","Jambon serrano","Bacon","Saucisse de Toulouse",
    "Chipolata","Merguez","Saucisson sec","Chorizo","Andouillette","Boudin noir",
    "Boudin blanc","Pâté","Rillettes","Terrine","Gigot d'agneau","Côtelette d'agneau",
    "Épaule d'agneau","Souris d'agneau","Cuisse de canard","Magret de canard","Confit de canard",
    "Foie gras","Lapin","Veau escalope","Blanquette de veau","Côte de veau","Tête de veau",
    "Foie de veau","Steak de cheval",
    "Saumon frais","Saumon fumé","Truite","Cabillaud","Lieu noir","Colin","Merlu",
    "Sole","Dorade","Bar","Thon frais","Thon en boîte","Maquereau","Sardine",
    "Anchois","Hareng","Raie","Lotte","Rouget","Turbot","Flétan","Crevette",
    "Crevette rose","Gambas","Langoustine","Homard","Crabe","Moule","Huître",
    "Coquille Saint-Jacques","Calamar","Poulpe","Seiche","Surimi","Tarama","Brandade"
  ],
  "Produits laitiers": [
    "Lait demi-écrémé","Lait entier","Lait écrémé","Lait sans lactose","Lait d'amande",
    "Lait de soja","Lait d'avoine","Lait de coco","Lait concentré","Lait en poudre",
    "Beurre doux","Beurre demi-sel","Beurre allégé","Margarine","Crème fraîche épaisse",
    "Crème fraîche liquide","Crème entière","Crème allégée","Crème fouettée","Mascarpone",
    "Yaourt nature","Yaourt aux fruits","Yaourt grec","Yaourt à boire","Yaourt soja",
    "Skyr","Fromage blanc","Petit-suisse","Faisselle","Crème dessert",
    "Camembert","Brie","Roquefort","Comté","Emmental","Gruyère","Cantal",
    "Reblochon","Mont d'Or","Munster","Chèvre frais","Chèvre sec","Bûche de chèvre",
    "Feta","Mozzarella","Burrata","Ricotta","Parmesan","Pecorino","Gorgonzola",
    "Bleu d'Auvergne","Tomme","Raclette","Fondue","Cheddar","Babybel","Vache qui rit",
    "Fromage râpé","Fromage à tartiner","Fromage frais ail et fines herbes","Saint-Nectaire",
    "Oeufs","Oeufs bio","Oeufs de caille",
    "Crème anglaise","Flan","Crème caramel"
  ],
  "Épicerie": [
    "Pâtes spaghetti","Pâtes penne","Pâtes coquillettes","Pâtes tagliatelles","Pâtes lasagne",
    "Pâtes fusilli","Riz basmati","Riz rond","Riz complet","Riz thaï","Riz à risotto",
    "Semoule","Quinoa","Boulgour","Polenta","Couscous","Farine de blé","Farine complète",
    "Farine de sarrasin","Fécule de maïs","Levure boulangère","Levure chimique",
    "Sucre blanc","Sucre roux","Sucre vanillé","Sucre glace","Miel","Sirop d'agave",
    "Sirop d'érable","Confiture fraise","Confiture abricot","Confiture framboise",
    "Pâte à tartiner","Beurre de cacahuète","Nutella",
    "Huile d'olive","Huile de tournesol","Huile de colza","Huile de sésame","Huile de coco",
    "Vinaigre balsamique","Vinaigre de vin","Vinaigre de cidre","Moutarde","Mayonnaise",
    "Ketchup","Sauce soja","Sauce worcestershire","Tabasco","Sauce barbecue","Vinaigrette",
    "Sel fin","Sel de Guérande","Poivre noir","Poivre blanc","Paprika","Curry","Cumin",
    "Curcuma","Cannelle","Muscade","Herbes de Provence","Origan","Piment de Cayenne",
    "Bouillon de légumes","Bouillon de poule","Bouillon de boeuf","Fond de veau",
    "Tomates pelées","Coulis de tomate","Concentré de tomate","Sauce tomate","Pesto",
    "Olives vertes","Olives noires","Câpres","Cornichons au vinaigre","Maïs en boîte",
    "Petits pois en boîte","Haricots rouges","Pois chiches","Lentilles vertes","Lentilles corail",
    "Flageolets","Thon au naturel","Sardines à l'huile","Soupe en brique","Velouté",
    "Chapelure","Pain de mie","Pain complet","Baguette","Pain burger","Pain pita",
    "Tortillas","Wraps","Crêpes","Biscottes","Céréales corn flakes","Muesli","Granola",
    "Porridge flocons d'avoine","Biscuits sablés","Biscuits chocolat","Madeleines",
    "Spéculoos","Gâteau au chocolat","Pâte feuilletée","Pâte brisée","Pâte sablée",
    "Levure de boulanger","Chocolat noir","Chocolat au lait","Chocolat blanc","Cacao en poudre",
    "Pépites de chocolat","Amandes","Noix","Noisettes","Pistaches","Cacahuètes",
    "Noix de cajou","Graines de tournesol","Graines de chia","Graines de lin","Raisins secs",
    "Chips","Crackers","Popcorn","Tartare d'algues","Sushi (kit)","Nori","Vermicelles de riz",
    "Sauce nuoc-mam","Lait de coco (cuisine)","Pâte de curry","Sauce hoisin","Vinaigre de riz",
    "Fruits secs mélangés","Cake aux fruits","Galettes de riz","Houmous","Tapenade",
    "Guacamole","Gelée dessert","Sirop grenadine","Sirop menthe","Levure nutritionnelle",
    "Tofu","Tofu fumé","Tempeh","Seitan","Steak végétal","Falafels","Galette de légumes"
  ],
  "Boissons": [
    "Eau plate","Eau gazeuse","Eau aromatisée","Jus d'orange","Jus de pomme","Jus de raisin",
    "Jus multifruits","Jus de tomate","Jus de citron","Smoothie","Soda cola","Limonade",
    "Soda agrumes","Tonic","Thé glacé","Boisson énergisante","Sirop de fruits","Café moulu",
    "Café en grains","Café soluble","Capsules de café","Thé noir","Thé vert","Tisane",
    "Chocolat chaud en poudre","Lait chocolaté","Vin rouge","Vin blanc","Vin rosé",
    "Champagne","Crémant","Bière blonde","Bière brune","Bière sans alcool","Cidre",
    "Whisky","Vodka","Rhum","Gin","Pastis","Apéritif anisé","Porto","Liqueur"
  ],
  "Surgelés": [
    "Légumes mélangés surgelés","Petits pois surgelés","Haricots verts surgelés",
    "Épinards surgelés","Brocolis surgelés","Frites surgelées","Pommes noisettes",
    "Pizza surgelée","Lasagnes surgelées","Quenelles","Nuggets de poulet","Cordon bleu",
    "Filet de poisson pané","Fruits de mer surgelés","Crevettes surgelées","Glace vanille",
    "Glace chocolat","Sorbet fruits","Bâtonnets glacés","Crêpes surgelées","Quiche surgelée",
    "Tarte aux pommes surgelée","Pâte feuilletée surgelée","Fruits rouges surgelés",
    "Mangue surgelée","Pain surgelé","Viennoiserie surgelée","Galettes de pommes de terre",
    "Wok de légumes surgelé","Riz cantonais surgelé","Soupe surgelée","Beignets de crevettes"
  ],
  "Hygiène": [
    "Shampoing","Après-shampoing","Gel douche","Savon","Dentifrice","Brosse à dents",
    "Fil dentaire","Bain de bouche","Déodorant","Mousse à raser","Rasoir","Crème hydratante",
    "Crème solaire","Lait corporel","Coton-tige","Coton démaquillant","Démaquillant",
    "Mouchoirs","Papier toilette","Lingettes bébé","Couches","Lait de toilette bébé",
    "Protections périodiques","Tampons","Préservatifs","Médicaments courants","Pansements",
    "Désinfectant","Gel hydroalcoolique","Parfum","Eau de toilette","Vernis à ongles",
    "Coton hydrophile","Sérum visage","Masque visage","Baume à lèvres"
  ],
  "Autre": [
    "Lessive","Adoucissant","Liquide vaisselle","Éponge","Sac poubelle","Papier essuie-tout",
    "Nettoyant multi-usage","Nettoyant vitres","Javel","Désodorisant intérieur","Bougie",
    "Allumettes","Pile AA","Pile AAA","Ampoule LED","Sac congélation","Film plastique",
    "Papier aluminium","Papier sulfurisé","Croquettes chien","Croquettes chat","Pâtée chat",
    "Litière chat","Friandises animaux","Plante d'intérieur","Terreau","Sac cabas",
    "Ficelle cuisine","Bocal de conservation","Filtre à café papier"
  ]
};

// Flat list for autocomplete: [{name, category}]
const PRODUCT_FLAT = Object.entries(PRODUCT_CATALOG).flatMap(([cat, items]) =>
  items.map(name => ({ name, category: cat }))
);
