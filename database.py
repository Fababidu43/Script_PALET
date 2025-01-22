# database.py
import logging
import pyodbc

class Database:
    def __init__(self, driver, system, user, password, database):
        self.conn_str = (
            f"DRIVER={driver};"
            f"SYSTEM={system};"
            f"UID={user};"
            f"PWD={password};"
            f"DATABASE={database}"
        )
        self.conn = None  # Initialiser conn à None

    def establish_connection(self):
        try:
            logging.info("Tentative d'établissement de la connexion à la base de données.")
            self.conn = pyodbc.connect(
                self.conn_str,
                timeout=5  # Timeout en secondes
            )
            logging.info("Connexion établie avec succès.")
        except pyodbc.Error as e:
            logging.error(f"Erreur SQL lors de la connexion à la base de données : {e}", exc_info=True)
            self.conn = None  # Assurer que conn est défini
            raise  # Relever l'exception pour être gérée ailleurs
        except Exception as e:
            logging.error(f"Erreur inattendue lors de la connexion à la base de données : {e}", exc_info=True)
            self.conn = None  # Assurer que conn est défini
            raise  # Relever l'exception pour être gérée ailleurs

    def fetch_sku_data_by_sku(self, sku):
        """
        Récupère les données de la table STAR01 et le stock disponible à partir de STK00131 en utilisant le SKU.
        """
        query = """
            SELECT 
                s.A1PNTC, 
                s.A1LGUC, 
                s.A1LAUC, 
                s.A1HAUC, 
                s.A1VOLU, 
                s.A1STE, 
                s.A1STAT, 
                s.A1ART, 
                s.A1DESI, 
                s.A1DES2, 
                s.A1GENC, 
                s.A1MARQ,
                k.SQTED
            FROM 
                RDYDTA01.STAR01 s
            LEFT JOIN 
                RDYDTA01.STK00131 k 
                ON s.A1STE = k.SSTE AND s.A1ART = k.SARTIC
            WHERE 
                TRIM(s.A1SKU) = ?
        """
        params = (sku,)
        conn = None  # Initialiser conn à None

        try:
            self.establish_connection()
            if not self.conn:
                logging.error("Connexion à la base de données non établie.")
                return None

            cursor = self.conn.cursor()
            logging.info(f"Exécution de la requête avec SKU : '{sku}'")
            cursor.execute(query, params)
            columns = [column[0].strip() for column in cursor.description]
            result = cursor.fetchone()
            if result:
                data = dict(zip(columns, result))
                logging.info(f"Données trouvées pour SKU '{sku}': {data}")
                return data
            else:
                logging.info(f"Aucune donnée trouvée pour SKU '{sku}'")
                return None
        except pyodbc.Error as e:
            logging.error(f"Erreur SQL lors de fetch_sku_data_by_sku : {e}", exc_info=True)
            logging.error(f"Paramètres utilisés : {params}")
            return None
        except Exception as e:
            logging.error(f"Erreur inattendue lors de fetch_sku_data_by_sku : {e}", exc_info=True)
            logging.error(f"Paramètres utilisés : {params}")
            return None
        finally:
            if self.conn:
                try:
                    cursor.close()
                    logging.info("Cursor fermé.")
                except Exception as e:
                    logging.error(f"Erreur lors de la fermeture du cursor : {e}", exc_info=True)

    def fetch_sku_data_by_art(self, art, company_number):
        """
        Récupère les données de la table STAR01 et le stock disponible à partir de STK00131 en utilisant le numéro d'article (A1ART) et le numéro de société (A1STE).
        """
        query = """
            SELECT 
                s.A1PNTC, 
                s.A1LGUC, 
                s.A1LAUC, 
                s.A1HAUC, 
                s.A1VOLU, 
                s.A1STE, 
                s.A1STAT, 
                s.A1ART, 
                s.A1DESI, 
                s.A1DES2, 
                s.A1GENC, 
                s.A1MARQ,
                k.SQTED
            FROM 
                RDYDTA01.STAR01 s
            LEFT JOIN 
                RDYDTA01.STK00131 k 
                ON s.A1STE = k.SSTE AND s.A1ART = k.SARTIC
            WHERE 
                s.A1ART = ? AND s.A1STE = ?
        """
        params = (art, company_number)
        conn = None  # Initialiser conn à None

        try:
            self.establish_connection()
            if not self.conn:
                logging.error("Connexion à la base de données non établie.")
                return None

            cursor = self.conn.cursor()
            logging.info(f"Exécution de la requête avec A1ART : '{art}' et A1STE : '{company_number}'")
            cursor.execute(query, params)
            columns = [column[0].strip() for column in cursor.description]
            result = cursor.fetchone()
            if result:
                data = dict(zip(columns, result))
                logging.info(f"Données trouvées pour A1ART '{art}' et A1STE '{company_number}': {data}")
                return data
            else:
                logging.info(f"Aucune donnée trouvée pour A1ART '{art}' et A1STE '{company_number}'")
                return None
        except pyodbc.Error as e:
            logging.error(f"Erreur SQL lors de fetch_sku_data_by_art : {e}", exc_info=True)
            logging.error(f"Paramètres utilisés : {params}")
            return None
        except Exception as e:
            logging.error(f"Erreur inattendue lors de fetch_sku_data_by_art : {e}", exc_info=True)
            logging.error(f"Paramètres utilisés : {params}")
            return None
        finally:
            if self.conn:
                try:
                    cursor.close()
                    logging.info("Cursor fermé.")
                except Exception as e:
                    logging.error(f"Erreur lors de la fermeture du cursor : {e}", exc_info=True)

    def fetch_paletization_data(self, entry, search_type="SKU", company_number=None):
        """
        Récupère les données de paletisation (A2QTCO, A2QTCP, A2QTUCP, A2QTCOP) depuis STAR02 en fonction du type de recherche.
        
        :param entry: SKU ou Numéro d'Article
        :param search_type: "SKU" ou "Article"
        :param company_number: Numéro de Société (requis si search_type est "Article")
        :return: Dictionnaire des données de paletisation ou None
        """
        if search_type == "SKU":
            query = """
                SELECT 
                    A2QTCO, 
                    A2QTCP, 
                    A2QTUCP,
                    A2QTCOP
                FROM 
                    RDYDTA01.STAR02
                WHERE 
                    TRIM(A2SKU) = ?
            """
            params = (entry,)
        elif search_type == "Article":
            query = """
                SELECT 
                    A2QTCO, 
                    A2QTCP, 
                    A2QTUCP,
                    A2QTCOP
                FROM 
                    RDYDTA01.STAR02
                WHERE 
                    TRIM(A2ART) = ? AND TRIM(A2STE) = ?
            """
            params = (entry, company_number)
        else:
            logging.warning(f"Type de recherche inconnu dans fetch_paletization_data : {search_type}")
            return None

        conn = None  # Initialiser conn à None

        try:
            self.establish_connection()
            if not self.conn:
                logging.error("Connexion à la base de données non établie.")
                return None

            cursor = self.conn.cursor()
            if search_type == "SKU":
                logging.info(f"Exécution de la requête de paletisation avec SKU : '{entry}'")
            else:
                logging.info(f"Exécution de la requête de paletisation avec A2ART : '{entry}' et A2STE : '{company_number}'")
            cursor.execute(query, params)
            columns = [column[0].strip() for column in cursor.description]
            results = cursor.fetchall()
            if results:
                last_row = results[-1]  # Sélectionne la dernière ligne
                data = dict(zip(columns, last_row))
                logging.info(f"Données de paletisation (dernière ligne) pour '{entry}': {data}")
                return data
            else:
                logging.info(f"Aucune donnée de paletisation trouvée pour '{entry}'")
                return None
        except pyodbc.Error as e:
            logging.error(f"Erreur SQL lors de fetch_paletization_data : {e}", exc_info=True)
            logging.error(f"Paramètres utilisés : {params}")
            return None
        except Exception as e:
            logging.error(f"Erreur inattendue lors de fetch_paletization_data : {e}", exc_info=True)
            logging.error(f"Paramètres utilisés : {params}")
            return None
        finally:
            if self.conn:
                try:
                    cursor.close()
                    logging.info("Cursor fermé.")
                except Exception as e:
                    logging.error(f"Erreur lors de la fermeture du cursor : {e}", exc_info=True)

    def close_connection(self):
        if self.conn:
            try:
                self.conn.close()
                logging.info("Connexion à la base de données fermée.")
            except pyodbc.Error as e:
                logging.error(f"Erreur lors de la fermeture de la connexion : {e}", exc_info=True)
            except Exception as e:
                logging.error(f"Erreur inattendue lors de la fermeture de la connexion : {e}", exc_info=True)
            finally:
                self.conn = None
