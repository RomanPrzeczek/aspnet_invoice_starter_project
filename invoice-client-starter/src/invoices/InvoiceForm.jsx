import {useEffect, useState} from "react";
import {useNavigate, useParams, Link} from "react-router-dom";
import { useTranslation } from "react-i18next";

import {apiGet, apiPost, apiPut} from "../utils/api";

import InputField from "../components/InputField";
import InputSelect from "../components/InputSelect";
import FlashMessage from "../components/FlashMessage";

const InvoiceForm = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {id} = useParams();
    
    const [personsListState, setPersonsList] = useState([]); // list of persons (sellers and buyers) to read from

    const [invoice, setInvoice] = useState({
        invoiceNumber: "",
        issued: "",
        dueDate: "",
        product: "",
        price: "",
        vat: "",
        note: "",
        seller: "", // id
        buyer: "", // id
    });

    const [sentState, setSent] = useState(false);
    const [successState, setSuccess] = useState(false);
    const [errorState, setError] = useState(null);

    useEffect(() => {
        if (id) {
            apiGet("/api/invoices/" + id).then((data) => {
                setInvoice({
                    ...data,
                    seller: data.seller?._id ?? "", // object to string ID
                    buyer: data.buyer?._id ?? "",
                })
            });
        }
    }, [id]);
    
    useEffect(() => {
    apiGet("/api/persons").then((data) => setPersonsList(data));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
    
        if (!invoice.seller || !invoice.buyer) {
            setError(`${t('ChooseSellerBuyer')}`);
            setSent(true);
            setSuccess(false);
            return;
        }
    
        const invoiceToSend = {
            ...invoice,
            seller: { _id: invoice.seller },
            buyer: { _id: invoice.buyer }
        };
           
        (id ? apiPut("/api/invoices/" + id, invoiceToSend) : apiPost("/api/invoices", invoiceToSend))
            .then(() => {
                setSent(true);
                setSuccess(true);
                navigate("/invoices");
            })
            .catch((error) => {
                console.log(error.message);
                setError(error.message);
                setSent(true);
                setSuccess(false);
            });
    };
    
    const sent = sentState;
    const success = successState;

    return (
        <div>
            <h1>{id ? `${t('UpdateInvoice')}` : `${t('CreateInvoice')}`}</h1>
            <hr/>
            {errorState ? (
                <div className="alert alert-danger">{errorState}</div>
            ) : null}
            {sent && (
                <FlashMessage
                    theme={success ? "success" : ""}
                    text={success ? `${t('InvoiceSuccessfullySaved')}` : ""}
                />
            )}
            <form onSubmit={handleSubmit}>
                <InputField
                    required={true}
                    type="text"
                    name="invoiceNumber"
                    min="3"
                    label={t('InvoiceNumber')}
                    prompt={t('InsertInvoiceNumber')}
                    value={invoice.invoiceNumber}
                    handleChange={(e) => {
                        setInvoice({...invoice, invoiceNumber: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="issued"
                    min="3"
                    label={t('Issued')}
                    prompt={t('InsertIssuedDate')}
                    value={invoice.issued}
                    handleChange={(e) => {
                        setInvoice({...invoice, issued: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="dueDate"
                    min="3"
                    label={t('Duedate')}
                    prompt={t('InsertDueDate')}
                    value={invoice.dueDate}
                    handleChange={(e) => {
                        setInvoice({...invoice, dueDate: e.target.value});
                    }}
                />
                                
                <InputField
                    required={true}
                    type="text"
                    name="product"
                    min="2"
                    label={t('ProductScope')}
                    prompt={t('InsertProductScope')}
                    value={invoice.product}
                    handleChange={(e) => {
                        setInvoice({...invoice, product: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="price"
                    min="1"
                    label={t('PriceDescription')}
                    prompt={t('InsertPriceDescription')}
                    value={invoice.price}
                    handleChange={(e) => {
                        setInvoice({...invoice, price: e.target.value});
                    }}
                />
                
                <InputField
                    required={true}
                    type="text"
                    name="vat"
                    min="2"
                    label={t('VAT')}
                    prompt={t('InsertVAT')}
                    value={invoice.vat}
                    handleChange={(e) => {
                        setInvoice({...invoice, vat: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="note"
                    min="3"
                    label={t('Note')}
                    prompt={t('InsertNote')}
                    value={invoice.note}
                    handleChange={(e) => {
                        setInvoice({...invoice, note: e.target.value});
                    }}
                />

                <InputSelect
                    required={true}
                    type="select"
                    multiple={false}
                    name="seller"
                    label={t('Seller')}
                    prompt={t('InsertSeller')}
                    value={invoice.seller}
                    items={personsListState}
                    handleChange={(e) => {
                        setInvoice({ ...invoice, seller: Number(e.target.value) });
                    }}
                />

                <InputSelect
                    required={true}
                    type="select"
                    multiple={false}
                    name="buyer"
                    label={t('Buyer')}
                    prompt={t('InsertBuyer')}
                    value={invoice.buyer}
                    items={personsListState}
                    handleChange={(e) => {
                        setInvoice({ ...invoice, buyer: Number(e.target.value) });
                    }}
                />
                <div className="d-flex justify-content-between mt-4">
                    <Link to={"/invoices"} className="btn btn-secondary mt-2">
                        {t('BackToInvoices')}
                    </Link>
                    <input type="submit" className="btn btn-primary" value={t('Save')}/>
                </div>
            </form>
        </div>
    );
};

export default InvoiceForm;
