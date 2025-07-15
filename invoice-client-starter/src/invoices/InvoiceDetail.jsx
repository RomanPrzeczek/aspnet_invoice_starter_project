import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../utils/api"; // uprav podle umístění souboru

const InvoiceDetail = () => {
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
                <h1>Detail faktury</h1>
                <hr />
                <h3>#{invoice.invoiceNumber} ({invoice.product})</h3>
                <p>
                    <strong>Dodavatel:</strong>
                    <br />
                    {invoice.seller?.name}
                </p>
                <p>
                   <strong>Odběratel:</strong>
                    <br />
                   {invoice.buyer?.name}
                </p>
                <p>
                    <strong>Vystaveno:</strong>
                    <br />
                    {invoice.issued}
                </p>
                <p>
                    <strong>Datum splatnosti:</strong>
                    <br />
                    {invoice.dueDate}
                </p>
                <p>
                    <strong>Částka:</strong>
                    <br />
                    {invoice.price}
                </p>
                <p>
                    <strong>DPH:</strong>
                    <br />
                    {invoice.vat}
                </p>
                <p>
                    <strong>Poznámka:</strong>
                    <br />
                    {invoice.note}
                </p>
                <Link to={"/invoices"} className="btn btn-secondary mt-2">
                    Zpět na přehled faktur
                </Link>
            </div>
        </>
    );
};

export default InvoiceDetail;
