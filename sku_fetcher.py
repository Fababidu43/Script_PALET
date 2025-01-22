# sku_fetcher.py
import logging
from database import Database

class SKUFetcher:
    def __init__(self, db_config):
        self.db = Database(**db_config)

    def get_sku_data(self, entries, search_type="SKU", company_number=None):
        """
        Pour chaque SKU ou Numéro d'Article, récupère les données correspondantes.
        Inclut également les données de paletisation depuis STAR02.
        
        :param entries: Liste de SKU ou Numéros d'Articles
        :param search_type: "SKU" ou "Article"
        :param company_number: Numéro de Société (requis si search_type est "Article")
        :return: Dictionnaire des résultats
        """
        results = {}
        for entry in entries:
            entry = entry.strip()
            if not entry:
                results[entry] = None
                logging.warning("Entrée vide trouvée dans la liste des entrées.")
                continue

            try:
                if search_type == "SKU":
                    logging.info(f"Récupération des données pour le SKU : {entry}")
                    data = self.db.fetch_sku_data_by_sku(entry)
                elif search_type == "Article":
                    if not company_number:
                        logging.warning(f"Numéro de Société non fourni pour la recherche par Article : {entry}")
                        results[entry] = None
                        continue
                    logging.info(f"Récupération des données pour l'article : {entry} et la société : {company_number}")
                    data = self.db.fetch_sku_data_by_art(entry, company_number)
                else:
                    logging.warning(f"Type de recherche inconnu : {search_type} pour l'entrée : {entry}")
                    results[entry] = None
                    continue

                if data:
                    # Récupérer les données de paletisation
                    paletization_data = self.db.fetch_paletization_data(entry, search_type, company_number)
                    results[entry] = {
                        "weight": data.get("A1PNTC"),
                        "length": data.get("A1LGUC"),
                        "width": data.get("A1LAUC"),
                        "height": data.get("A1HAUC"),
                        "volume": data.get("A1VOLU"),
                        "stock_available": data.get("SQTED"),
                        "stock": data.get("A1STE"),
                        "status": data.get("A1STAT"),
                        "article": data.get("A1ART"),
                        "description_1": data.get("A1DESI"),
                        "description_2": data.get("A1DES2"),
                        "general_code": data.get("A1GENC"),
                        "brand": data.get("A1MARQ"),
                        "paletization": {
                            "a2qtco": paletization_data.get("A2QTCO") if paletization_data else None,
                            "a2qtcp": paletization_data.get("A2QTCP") if paletization_data else None,
                            "a2qtucp": paletization_data.get("A2QTUCP") if paletization_data else None,
                            "a2qtcop": paletization_data.get("A2QTCOP") if paletization_data else None
                        }
                    }
                    logging.info(f"Données récupérées pour l'entrée '{entry}'.")
                else:
                    results[entry] = None
                    logging.info(f"Aucune donnée trouvée pour l'entrée '{entry}'.")
            except Exception as e:
                logging.error(f"Erreur lors de la récupération des données pour l'entrée '{entry}' : {e}", exc_info=True)
                results[entry] = None
        return results
