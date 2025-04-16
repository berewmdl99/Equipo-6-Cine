import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackToMenuButton from '../components/BackToMenuButton';

const ImprimirBoleto = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { boletos, pago } = location.state || {};

    if (!boletos || !pago) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">No hay información de boletos para mostrar</div>
            </div>
        );
    }

    const handleImprimir = () => {
        window.print();
    };

    // Tomamos el primer boleto como referencia para la información común
    const primerBoleto = boletos[0];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="print:hidden">
                <BackToMenuButton />
            </div>
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 print:shadow-none">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">Boletos de Cine</h1>
                    <p className="text-gray-600">Fecha de impresión: {new Date().toLocaleString()}</p>
                    <p className="text-gray-600">Impreso por: {user.nombre}</p>
                </div>

                <div className="space-y-4">
                    <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold mb-2">Detalles de la Película</h2>
                        <p><span className="font-medium">Película:</span> {primerBoleto.funcion.pelicula.titulo}</p>
                        <p><span className="font-medium">Sala:</span> {primerBoleto.funcion.sala.nombre}</p>
                        <p><span className="font-medium">Fecha:</span> {new Date(primerBoleto.funcion.fecha).toLocaleDateString()}</p>
                        <p><span className="font-medium">Hora:</span> {primerBoleto.funcion.hora}</p>
                    </div>

                    <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold mb-2">Detalles de los Boletos</h2>
                        {boletos.map((boleto, index) => (
                            <div key={boleto.id} className="mb-4">
                                <p><span className="font-medium">Boleto {index + 1}:</span></p>
                                <p className="ml-4"><span className="font-medium">Número de Boleto:</span> {boleto.id}</p>
                                <p className="ml-4"><span className="font-medium">Asiento:</span> {boleto.asiento.fila}{boleto.asiento.numero}</p>
                                <p className="ml-4"><span className="font-medium">Precio:</span> ${boleto.precio}</p>
                            </div>
                        ))}
                        <p className="text-lg mt-4"><span className="font-medium">Total:</span> ${pago.monto_pagado}</p>
                    </div>

                    <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold mb-2">Detalles del Pago</h2>
                        <p><span className="font-medium">Monto Pagado:</span> ${pago.monto_pagado}</p>
                        <p><span className="font-medium">Cambio:</span> ${pago.cambio}</p>
                        <p><span className="font-medium">Fecha de Pago:</span> {new Date(pago.fecha_pago).toLocaleString()}</p>
                    </div>
                </div>

                <div className="mt-8 text-center print:hidden">
                    <button
                        onClick={handleImprimir}
                        className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
                    >
                        Imprimir Boletos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImprimirBoleto; 