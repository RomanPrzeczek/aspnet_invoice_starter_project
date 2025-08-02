import { useTranslation } from "react-i18next";
import czFlag from "../assets/flag-cz-svgrepo-com.svg"
import enFlag from "../assets/flag-for-flag-united-kingdom-svgrepo-com.svg"

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="d-flex gap-2 align-items-center">
      <button
        className={`btn btn-sm ${i18n.language === 'cs' ? 'btn-primary' : 'btn-outline-primary'}`}
        onClick={() => changeLanguage('cs')}
      >
        <img src={czFlag} alt="Čeština" width="24" />
      </button>
      <button 
        className={`btn btn-sm ${i18n.language === 'en' ? 'btn-primary' : 'btn-outline-primary'}`}
        onClick={() => changeLanguage('en')}
      >
        <img src={enFlag} alt="Angličtina" width="24" />
      </button>
    </div>
  );
};

export default LanguageSwitcher;