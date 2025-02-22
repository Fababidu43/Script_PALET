# gui_app.py
import tkinter as tk
from tkinter import ttk
from tkinter import messagebox, filedialog
from sku_fetcher import SKUFetcher
import pandas as pd
import requests
import sys
import os
import subprocess
from version import __version__
import logging

# Configurer le logging
def setup_logging():
    # Déterminer le répertoire de l'application
    if getattr(sys, 'frozen', False):
        # Si l'application est empaquetée avec PyInstaller
        application_path = os.path.dirname(sys.executable)
    else:
        # Si l'application est exécutée directement
        application_path = os.path.dirname(os.path.abspath(__file__))

    log_file = os.path.join(application_path, 'app.log')

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    logging.info("Journalisation initialisée.")

setup_logging()

# Configuration de la base de données
db_config = {
    "driver": "{IBM i Access ODBC Driver}",
    "system": "192.128.0.1",
    "user": "fmeasson",
    "password": "beauzac",
    "database": "RDYDTA01"
}

# Informations GitHub pour les mises à jour
GITHUB_API_URL = "https://api.github.com/repos/Fababidu43/Script_PALET/releases/latest"
DOWNLOAD_URL_PREFIX = "https://github.com/Fababidu43/Script_PALET/releases/download/"

class Application(tk.Tk):
    def __init__(self, fetcher):
        super().__init__()
        self.title("Système de Recherche SKU / Numéro d'Article")
        self.geometry("1300x800")  # Ajusté pour plus d'espace
        self.fetcher = fetcher
        self.create_widgets()
        self.data = pd.DataFrame()  # Pour stocker les données récupérées
        logging.info("Application initialisée.")

    def create_widgets(self):
        try:
            # Label d'Entrée
            input_label = tk.Label(self, text="Entrez les SKU ou numéros d'articles (séparés par des virgules ou des nouvelles lignes) :")
            input_label.pack(pady=10)

            # Zone de Texte pour l'Entrée
            self.input_text = tk.Text(self, height=5)
            self.input_text.pack(fill=tk.X, padx=20, pady=5)

            # Cadre des Options
            options_frame = tk.Frame(self)
            options_frame.pack(pady=10)

            # Variable pour Stocker l'Option Sélectionnée
            self.search_type = tk.StringVar(value="SKU")

            # Radio Buttons pour Choisir entre SKU et Numéro d'Article
            sku_radio = tk.Radiobutton(options_frame, text="SKU", variable=self.search_type, value="SKU", command=self.toggle_company_entry)
            sku_radio.grid(row=0, column=0, padx=5, pady=5, sticky='w')

            art_radio = tk.Radiobutton(options_frame, text="Numéro d'Article", variable=self.search_type, value="Article", command=self.toggle_company_entry)
            art_radio.grid(row=0, column=1, padx=5, pady=5, sticky='w')

            # Champ pour Entrer le Numéro de Société (Visible uniquement si Numéro d'Article est Sélectionné)
            self.company_label = tk.Label(options_frame, text="Numéro de Société :")
            self.company_entry = tk.Entry(options_frame)
            self.company_label.grid(row=0, column=2, padx=5, pady=5, sticky='w')
            self.company_entry.grid(row=0, column=3, padx=5, pady=5, sticky='w')
            self.company_label.grid_remove()
            self.company_entry.grid_remove()

            # Cadre des Boutons
            buttons_frame = tk.Frame(self)
            buttons_frame.pack(pady=10)

            # Bouton pour Récupérer les Données
            fetch_button = tk.Button(buttons_frame, text="Récupérer les données", command=self.fetch_data)
            fetch_button.pack(side=tk.LEFT, padx=5)

            # Bouton pour Exporter vers Excel
            export_button = tk.Button(buttons_frame, text="Exporter vers Excel", command=self.export_to_excel)
            export_button.pack(side=tk.LEFT, padx=5)

            # Bouton pour Vérifier les Mises à Jour
            update_button = tk.Button(buttons_frame, text="Vérifier les mises à jour", command=self.check_for_updates)
            update_button.pack(side=tk.LEFT, padx=5)

            # Treeview pour Afficher les Données
            self.tree = ttk.Treeview(self, columns=("SKU", "Poids", "Longueur", "Largeur", "Hauteur", "Volume",
                                                    "Stock Disponible", "Société", "Statut du Produit",
                                                    "Numéro d'Article", "Libellé du Produit",
                                                    "Libellé Long du Produit", "EAN du Produit",
                                                    "Marque", "Nombre de colis par couche",
                                                    "Nombre de couches par palette",
                                                    "Quantité UC par palette calculée",
                                                    "Nombre de colis par palette"),
                                     show='headings')
            # Définir les En-têtes
            for col in self.tree["columns"]:
                self.tree.heading(col, text=col)
                if col == "Nombre de colis par palette":
                    self.tree.column(col, width=150, anchor=tk.CENTER)
                else:
                    self.tree.column(col, width=100, anchor=tk.CENTER)
            # Ajouter une Barre de Défilement Verticale
            scrollbar = ttk.Scrollbar(self, orient=tk.VERTICAL, command=self.tree.yview)
            self.tree.configure(yscroll=scrollbar.set)
            scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
            self.tree.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

            logging.info("Widgets créés avec succès.")

        except Exception as e:
            logging.error("Erreur lors de la création des widgets.", exc_info=True)
            messagebox.showerror("Erreur", f"Erreur lors de la création des widgets : {e}")

    def toggle_company_entry(self):
        try:
            if self.search_type.get() == "Article":
                self.company_label.grid()
                self.company_entry.grid()
                logging.info("Option 'Numéro d'Article' sélectionnée.")
            else:
                self.company_label.grid_remove()
                self.company_entry.grid_remove()
                logging.info("Option 'SKU' sélectionnée.")
        except Exception as e:
            logging.error("Erreur lors du basculement de l'entrée du Numéro de Société.", exc_info=True)
            messagebox.showerror("Erreur", f"Erreur lors du basculement des options : {e}")

    def fetch_data(self):
        try:
            # Récupérer le Texte d'Entrée
            input_text = self.input_text.get("1.0", tk.END)
            logging.info("Texte d'entrée récupéré.")

            # Séparer par des virgules ou des nouvelles lignes
            entries = [entry.strip() for entry in input_text.replace(',', '\n').split('\n') if entry.strip()]
            logging.info(f"Entrées traitées : {entries}")

            if not entries:
                messagebox.showwarning("Avertissement", "Veuillez entrer au moins un SKU ou numéro d'article.")
                logging.warning("Aucune entrée fournie par l'utilisateur.")
                return

            # Déterminer le Type de Recherche
            search_type = self.search_type.get()
            company_number = None
            if search_type == "Article":
                company_number = self.company_entry.get().strip()
                if not company_number:
                    messagebox.showwarning("Avertissement", "Veuillez entrer un Numéro de Société pour la recherche par Numéro d'Article.")
                    logging.warning("Recherche par Numéro d'Article sélectionnée sans Numéro de Société.")
                    return

            logging.info(f"Type de recherche : {search_type}")
            if company_number:
                logging.info(f"Numéro de Société fourni : {company_number}")

            # Récupérer les Données
            results = self.fetcher.get_sku_data(entries, search_type, company_number)
            logging.info("Données récupérées via SKUFetcher.")

            if not results:
                messagebox.showinfo("Information", "Aucune donnée trouvée pour les entrées fournies.")
                logging.info("Aucune donnée trouvée pour les entrées fournies.")
                return

            # Vider le Treeview
            for item in self.tree.get_children():
                self.tree.delete(item)
            logging.info("Treeview vidé.")

            # Préparer les Données pour l'Affichage et l'Exportation
            data_list = []
            for entry, data in results.items():
                if data:
                    row = {
                        "SKU": entry,
                        "Poids": float(data['weight']) if data['weight'] else None,
                        "Longueur": float(data['length']) if data['length'] else None,
                        "Largeur": float(data['width']) if data['width'] else None,
                        "Hauteur": float(data['height']) if data['height'] else None,
                        "Volume": float(data['volume']) if data['volume'] else None,
                        "Stock Disponible": float(data['stock_available']) if data['stock_available'] else None,
                        "Société": int(data['stock']) if data['stock'] else None,
                        "Statut du Produit": data['status'],
                        "Numéro d'Article": int(data['article']) if data['article'] else None,
                        "Libellé du Produit": data['description_1'].strip() if data['description_1'] else None,
                        "Libellé Long du Produit": data['description_2'].strip() if data['description_2'] else None,
                        "EAN du Produit": data['general_code'],
                        "Marque": data['brand'].strip() if data['brand'] else None,
                        "Nombre de colis par couche": int(data['paletization']['a2qtco']) if data['paletization'] and data['paletization']['a2qtco'] else None,
                        "Nombre de couches par palette": int(data['paletization']['a2qtcp']) if data['paletization'] and data['paletization']['a2qtcp'] else None,
                        "Quantité UC par palette calculée": int(data['paletization']['a2qtucp']) if data['paletization'] and data['paletization']['a2qtucp'] else None,
                        "Nombre de colis par palette": int(data['paletization']['a2qtcop']) if data['paletization'] and data['paletization']['a2qtcop'] else None
                    }
                    data_list.append(row)
                    # Insérer dans le Treeview
                    self.tree.insert("", tk.END, values=tuple(row.values()))
            # Convertir en DataFrame
            self.data = pd.DataFrame(data_list)
            logging.info(f"{len(data_list)} entrées insérées dans le Treeview et converties en DataFrame.")
            messagebox.showinfo("Succès", "Données récupérées avec succès.")
        except Exception as e:
            logging.error("Erreur lors de la récupération des données.", exc_info=True)
            messagebox.showerror("Erreur", f"Erreur lors de la récupération des données : {e}")

    def export_to_excel(self):
        try:
            if self.data.empty:
                messagebox.showwarning("Avertissement", "Aucune donnée à exporter.")
                logging.warning("Tentative d'exportation sans données.")
                return
            # Demander à l'Utilisateur où Sauvegarder le Fichier
            file_path = filedialog.asksaveasfilename(defaultextension=".xlsx",
                                                     filetypes=[("Excel files", "*.xlsx"), ("All files", "*.*")])
            if not file_path:
                logging.info("Exportation annulée par l'utilisateur.")
                return
            try:
                self.data.to_excel(file_path, index=False)
                logging.info(f"Données exportées avec succès vers {file_path}.")
                messagebox.showinfo("Succès", f"Données exportées avec succès vers {file_path}.")
            except Exception as e:
                logging.error("Erreur lors de l'exportation des données vers Excel.", exc_info=True)
                messagebox.showerror("Erreur", f"Erreur lors de l'exportation des données : {e}")
        except Exception as e:
            logging.error("Erreur lors de la fonction export_to_excel.", exc_info=True)
            messagebox.showerror("Erreur", f"Erreur lors de l'exportation des données : {e}")

    # Fonction de Vérification des Mises à Jour
    def check_for_updates(self):
        try:
            logging.info("Vérification des mises à jour initiée.")
            response = requests.get(GITHUB_API_URL)
            response.raise_for_status()
            latest_release = response.json()
            latest_version = latest_release['tag_name'].lstrip('v')  # Supposons que les tags sont comme v1.0.0
            logging.info(f"Version actuelle : {__version__}, Version disponible : {latest_version}")
            if latest_version > __version__:
                answer = messagebox.askyesno("Mise à jour disponible",
                                             f"Une nouvelle version ({latest_version}) est disponible. Voulez-vous la télécharger et l'installer ?")
                if answer:
                    logging.info(f"Utilisateur a accepté de mettre à jour vers la version {latest_version}.")
                    self.download_and_install(latest_release)
                else:
                    logging.info("Utilisateur a refusé la mise à jour.")
            else:
                logging.info("Aucune mise à jour disponible.")
                messagebox.showinfo("Mise à jour", "Vous êtes déjà à jour.")
        except Exception as e:
            logging.error("Erreur lors de la vérification des mises à jour.", exc_info=True)
            messagebox.showerror("Erreur", f"Erreur lors de la vérification des mises à jour : {e}")

    # Fonction de Téléchargement et d'Installation des Mises à Jour
    def download_and_install(self, release):
        try:
            assets = release.get('assets', [])
            installer_url = None
            for asset in assets:
                if asset['name'].endswith('.exe'):
                    installer_url = asset['browser_download_url']
                    break
            if installer_url:
                logging.info(f"URL de l'installateur trouvé : {installer_url}")
                try:
                    response = requests.get(installer_url, stream=True)
                    response.raise_for_status()
                    installer_path = os.path.join(os.getenv('TEMP'), 'update_installer.exe')
                    with open(installer_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                    logging.info(f"Installateur téléchargé à {installer_path}")
                    # Exécuter l'installateur
                    subprocess.run([installer_path], check=True)
                    logging.info("Installateur exécuté avec succès. Fermeture de l'application.")
                    sys.exit()  # Fermer l'application actuelle
                except Exception as e:
                    logging.error("Erreur lors du téléchargement ou de l'installation de la mise à jour.", exc_info=True)
                    messagebox.showerror("Erreur", f"Impossible de télécharger ou d'installer la mise à jour : {e}")
            else:
                logging.error("URL de l'installateur non trouvée dans les assets de la release.")
                messagebox.showerror("Erreur", "Installer de mise à jour non trouvé.")
        except Exception as e:
            logging.error("Erreur lors de la fonction download_and_install.", exc_info=True)
            messagebox.showerror("Erreur", f"Erreur lors du téléchargement ou de l'installation de la mise à jour : {e}")

if __name__ == "__main__":
    try:
        logging.info("Démarrage de l'application.")
        fetcher = SKUFetcher(db_config)
        app = Application(fetcher)
        app.mainloop()
        logging.info("Application terminée normalement.")
    except Exception as e:
        logging.critical("Erreur critique lors du démarrage de l'application.", exc_info=True)
        messagebox.showerror("Erreur Critique", f"Une erreur critique est survenue : {e}")
