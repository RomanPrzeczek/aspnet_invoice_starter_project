import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../utils/api"; 
import { useTranslation } from "react-i18next";

const InvoiceDetail = () => {
    const {t} = useTranslation();
    const { id } = useParams();
    const [invoice, setInvoice] = useState({});

    useEffect(() => {
        apiGet("/api/invoices/" + id)
            .then((data) => {
                setInvoice(data);
            })
            .catch((error) => {
                console.error(error);
            });
    }, [id]);

    return (
        <>
            <div>
                <h1> {t('InvoiceDetail')} </h1>
                <hr />
                <h3>#{invoice.invoiceNumber} ({invoice.product})</h3>
                <p>
                    <strong>{t('Seller')}: </strong>
                    <br />
                    {invoice.seller?.name}
                </p>
                <p>
                   <strong>{t('Buyer')}: </strong>
                    <br />
                   {invoice.buyer?.name}
                </p>
                <p>
                    <strong>{t('Issued')}: </strong>
                    <br />
                    {invoice.issued}
                </p>
                <p>
                    <strong>{t('DueDate')} :</strong>
                    <br />
                    {invoice.dueDate}
                </p>
                <p>
                    <strong>{t('Price')} :</strong>
                    <br />
                    {invoice.price}
                </p>
                <p>
                    <strong>{t('VAT')} :</strong>
                    <br />
                    {invoice.vat}
                </p>
                <p>
                    <strong>{t('Note')} :</strong>
                    <br />
                    {invoice.note}
                </p>
                <Link to={"/invoices"} className="btn btn-secondary mt-2">
                    {t('BackToInvoices')}
                </Link>
            </div>
        </>
    );
};

export default InvoiceDetail;
