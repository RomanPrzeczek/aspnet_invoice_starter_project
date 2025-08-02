import { useTranslation } from "react-i18next";

const AboutApp = () => {
    const {t} = useTranslation();

    return(
        <div >
            <h1 className="mb-4">
                <i className="bi bi-info-circle-fill me-2"></i> 
                {t('AboutApp')}
            </h1>


            <p className="lead mb-4">
                {t('Welcome')}
            </p>

            <ul className="list-group list-group-flush text-start mb-4">
                <li className="list-group-item"><i className="bi bi-check-circle-fill text-success me-2"></i>
                    {t('Registerloginlogout')}
                </li>
                <li className="list-group-item"><i className="bi bi-check-circle-fill text-success me-2"></i>
                    {t('OverviewDetail')}
                </li>
                <li className="list-group-item"><i className="bi bi-check-circle-fill text-success me-2"></i>
                    {t('UpdateOf')}
                </li>
                <li className="list-group-item"><i className="bi bi-check-circle-fill text-success me-2"></i>
                    {t('ResponsiveDesign')}
                </li>
            </ul>

            <p className="text-muted">
                <a href="https://www.rero.cz/dovednosti.html" target="blank">
                    {t('Author')}: @Roman Przeczek 
                </a>
            </p>

            <h4 className="mb-3">
                <i className="bi bi-link-45deg me-2"></i>
                {t('DocumentationApp')} (GitHub)
            </h4>

            <ul className="list-group text-start mb-4">
                <li className="list-group-item">
                    <a href="https://github.com/RomanPrzeczek/aspnet_invoice_starter_project" target="_blank">
                        <i className="bi bi-github me-2"></i>Code
                    </a>
                </li>
                <li className="list-group-item">
                    <a href="https://github.com/RomanPrzeczek/aspnet_invoice_starter_project/blob/main/README.md" target="blank">
                        <i className="bi bi-file-earmark-text me-2"></i> Readme
                    </a>
                </li>
                <li className="list-group-item">
                    <a href="https://github.com/RomanPrzeczek/aspnet_invoice_starter_project/blob/main/API_REFERENCE.md" target="blank">
                        <i className="bi bi-file-earmark-code me-2"></i> API reference
                    </a>
                </li>
                                <li className="list-group-item">
                    <a href="https://github.com/RomanPrzeczek/aspnet_invoice_starter_project/blob/main/ASCIIdataModel.md" target="blank">
                        <i className="bi bi-file-earmark-code me-2"></i> ASCII data model
                    </a>
                </li>
                                <li className="list-group-item">
                    <a href="https://github.com/RomanPrzeczek/aspnet_invoice_starter_project/blob/main/UseCaseDiagram.md" target="blank">
                        <i className="bi bi-file-earmark-code me-2"></i> Use case diagram
                    </a>
                </li>
            </ul>
        </div>
    )
}

export default AboutApp;