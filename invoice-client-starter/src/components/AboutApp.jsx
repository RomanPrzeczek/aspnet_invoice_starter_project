const AboutApp = () => {
    return(
        <div >
            <h1 className="mb-4">
                <i className="bi bi-info-circle-fill me-2"></i> 
                O aplikaci Invoices
            </h1>


            <p className="lead mb-4">
                Vítejte v mé aplikaci simulující správu fakturačního systému:
            </p>

            <ul className="list-group list-group-flush text-start mb-4">
                <li className="list-group-item"><i className="bi bi-check-circle-fill text-success me-2"></i>
                - registraci, login, logout uživatelů
                </li>
                <li className="list-group-item"><i className="bi bi-check-circle-fill text-success me-2"></i>
                - řehledy a detail uživatelů a faktur
                </li>
                <li className="list-group-item"><i className="bi bi-check-circle-fill text-success me-2"></i>
                - úpravu a mazání uživateů a faktur
                </li>
                <li className="list-group-item"><i className="bi bi-check-circle-fill text-success me-2"></i>
                - responzivní, mobile-first design
                </li>
            </ul>

            <p className="text-muted">
                <a href="https://www.rero.cz/dovednosti.html" target="blank">
                    Autor: @Roman Przeczek 
                </a>
            </p>

            <h4 className="mb-3">
                <i className="bi bi-link-45deg me-2"></i>
                Pro vývojáře
            </h4>

            <ul className="list-group text-start mb-4">
                <li className="list-group-item">
                    <a href="https://github.com/RomanPrzeczek/aspnet_invoice_starter_project" target="_blank">
                        <i className="bi bi-github me-2"></i>GitHub
                    </a>
                </li>
                <li className="list-group-item">
                        <i className="bi bi-file-earmark-text me-2"></i> Readme
                </li>
                <li className="list-group-item">
                        <i className="bi bi-file-earmark-code me-2"></i> TestReadme
                </li>
            </ul>

            <h5 className="mb-2"><i className="bi bi-diagram-3-fill me-2"></i>Diagramy</h5>
            <ul className="list-group text-start">
                <li className="list-group-item">
                        <i className="bi bi-image me-2"></i>DiagramUseCase
                </li>
                <li className="list-group-item">
                        <i className="bi bi-image me-2"></i>DiagramERD
                </li>
                <li className="list-group-item">
                        <i className="bi bi-image me-2"></i>DiagramAppStructure
                </li>
            </ul>
        </div>
    )
}

export default AboutApp;