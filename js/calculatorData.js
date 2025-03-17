const createDate = (dt = null) => {
    if (!dt) return new Date();
    return new Date(`${dt}T00:00:00`)
}

const calculatorData = {
    loading: false,
    feeTaxesTypes: [
        { value: 0.5, label: '0,5%', description: 'Ideal para ajustes financeiros regulares e pequenos montantes.' },
        { value: 1, label: '1%', description: 'Eficiente para grandes valores e investimentos a longo prazo.' },
    ],
    indexes: {
        inpc: "INPC - IBGE",
        igpm: "IGP-M - FGV",
        ipca: "IPCA - IBGE",
        tjpr: "TJPR - MÉDIA ENTRE INPC E IGP-DI",
    },
    feeTaxes: [
        '0%',
        // 
        '0,5%', 
        '1%'
    ],
    // initialValue: null, /*120,*/
    initialValue: 120,
    totalValue: null,
    // index: null, /*'inpc', */
    index: 'inpc',
    // startDate: null, /* '2000-01-01',*/
    startDate:  '2000-01-01',
    // endDate: null, /*'2025-02-13',*/
    // endDate: null, /*'2025-02-13',*/
    endDate: '2025-02-13',
    datesTypes: {
        "0,5%": {
            startDate: '2000-02-01',
            endDate: '2003-03-01',
        },
        "1%": {
            startDate: '2003-03-01',
            endDate: '2025-02-13',
        }
    },
    errors: [],
    results: [],
    openDatePicker(feeTax, type) {
        const refName = type === 'start' ? `refStartDate_${feeTax}` : `refEndDate_${feeTax}`;
        const el = document.getElementById(refName);
        el.showPicker();
    },
    toggleFeeTax(feeTax) {
        if (this.feeTaxes.includes(feeTax)) {
            this.feeTaxes = this.feeTaxes.filter(fee => fee !== feeTax)
            delete this.datesTypes[feeTax];
        } else {
            this.datesTypes[feeTax] = { startDate: null, endDate: null };
            this.feeTaxes = [...this.feeTaxes, feeTax]
        }
    },
    get sortedFeeTaxesTypes() {
        return this.feeTaxesTypes.sort((a, b) => a.value - b.value);
    },
    get sortedFeeTaxes() {
        const toNumber = (val) => Number(val.replace("%", "").replace(",", "."))
        return [...this.feeTaxes].sort((a, b) => toNumber(a) - toNumber(b));
    },
    resultLabel(value) {
        const found = this.feeTaxesTypes.find(feeType => feeType.label === value);
        return found?.label ? `${found.label} ao mês` : 'Sem taxa de juros';
    },
    rowDataLabel(value) {
        const found = this.feeTaxesTypes.find(feeType => feeType.label === value);
        return `Selecione abaixo as datas para juros de ${found.label}`;
    },
    setCurrencyValue(event, index) {
        if (!/^[0-9]$/.test(event.key) && event.key !== 'Backspace') {
            event.preventDefault();
        }

        const formatedValue = this.currencyValue(event.target.value)
        event.target.value = formatedValue;
        this[index] = formatedValue;
    },
    currencyValue(val) {
        const digits = String(val).replace(/\D/g, '');
        const rawValue = parseInt(digits || '0', 10);
        return (rawValue / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    },
    async calculate() {
        this.loading = true;
        this.results = [];
        this.errors = [];
        this.totalValue = null;
        try {
            let errors = [];
            // Validações básicas
            if (!this.initialValue) errors.push('Preencha o valor inicial.');
            if (!this.index) errors.push('Selecione um índice.');
            if (!this.startDate) errors.push('Selecione a data inicial.');
            if (!this.endDate) errors.push('Selecione a data final.');
            if (this.feeTaxes.length === 0) errors.push('Selecione pelo menos um tipo de juros.');

            const minStartDate = createDate('1994-08-01');

            // Validações de datas
            const isValidDate = (date) => {
                const parsedDate = createDate(date);
                return !isNaN(parsedDate.getTime());
            };

            if (this.startDate && this.endDate) {
                if (!isValidDate(this.startDate) || !isValidDate(this.endDate)) {
                    errors.push('As datas inicial e final devem ser válidas.');
                } else {
                    const startDate = createDate(this.startDate);
                    const endDate = createDate(this.endDate);
                    if (startDate >= endDate) {
                        errors.push('A data inicial deve ser menor que a data final.');
                    }
                    if (createDate(startDate) < minStartDate) {
                        errors.push(`A data inicial deve ser posterior a 1º de agosto de 1994.`);
                    }

                    if (createDate(endDate) > createDate()) {
                        errors.push(`A data final deve ser menor que a data atual.`);
                    }

                }
            }

            this.sortedFeeTaxes.forEach((feeTax, i) => {
                const feeKey = this.sortedFeeTaxes[i]
                if (!this.datesTypes[feeKey]) return;
                const { startDate: feeStartDate, endDate: feeEndDate } = this.datesTypes[feeKey];
                if (!feeStartDate || !feeEndDate) {
                    errors.push(`A faixa de ${feeTax} deve ter datas válidas.`);
                    return;
                }

                if (!isValidDate(feeStartDate) || !isValidDate(feeEndDate)) {
                    errors.push(`As datas de ${feeTax} devem ser válidas.`);
                    return;
                }

                const feeStart = createDate(feeStartDate);
                const feeEnd = createDate(feeEndDate);

                if (feeStart > feeEnd) {
                    errors.push(`A data inicial de ${feeTax} deve ser menor que a data final.`);
                    return;
                }

                if (feeStart < createDate(this.startDate) || feeEnd > createDate(this.endDate)) {
                    errors.push(`As datas de ${feeTax} devem estar entre a data inicial e final.`);
                    return;
                }

                if (i > 1) {
                    const prevFeeKey = this.sortedFeeTaxes[i - 1]
                    const { endDate: prevFeeEndDate } = this.datesTypes[prevFeeKey];
                    const prevFeeEnd = createDate(prevFeeEndDate);

                    if (prevFeeEnd > feeStart) {
                        errors.push(`A data Inicial para os juros de ${feeTax} ao mês deve ser Maior ou Igual a Data Final dos juros de ${prevFeeKey} ao mês`);
                        return;
                    }
                }
            });


            if (errors.length > 0) {
                this.errors = errors;
                this.loading = false;
                return;
            }

            const swapCommaAndDot = (str) => {
                return str.replace(/\./g, '').replace(/,/g, '.');
            }

            const financialValue = parseFloat(swapCommaAndDot(String(this.initialValue)));

            const indexMapping = {
                inpc: "188",
                igpm: "189",
                ipca: "433",
                tjpr: "tjpr",
                "": ""
            };

            const indexVal = this.index;

            const index = indexMapping[indexVal];

            const startDate = this.startDate;
            const endDate = this.endDate;

            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = formatDate(endDate);

            let dates = this.datesTypes
            if (Object.keys(dates).length === 0) {
                dates = {
                    "0%": { startDate: startDate, endDate: endDate },
                };
            }


            const dataApi = async (index, startDate, endDate) => {
                const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${index}/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`;

                let attempt = 0;
                let success = false;
                let data;

                while (attempt < 3 && !success) {
                    try {
                        await pause(100 * attempt); // Aumenta o tempo de pausa a cada tentativa
                        const response = await fetch(url);

                        if (response.ok) {
                            data = await response.json();
                            success = true;
                        } else {
                            attempt++;
                        }
                    } catch (error) {
                        console.error(`Tentativa ${attempt + 1} falhou.`);
                        attempt++;
                    }
                }

                if (!success) {
                    window.alert(`Serviço indisponível no momento, tente novamente mais tarde.`);
                    location.reload();
                    return;
                }

                return data;
            };

            const apiRequest = async (index, startDate, endDate) => {
                if (
                    index === "" || monthDiff(convertStringToDate(startDate),
                        convertStringToDate(endDate)) === 0
                ) {
                    return {
                        accumulatedIndex: parseFloat(1.00000),
                        baseDate: convertStringToDate(endDate),
                    };
                }
                if (index === "tjpr") {
                    const values = ["190", "188"];
                    const dataArrays = [];

                    let getTjprBefore = 0;

                    const startInpcIgpdi = new Date(1995, 6, 1);
                    let userSelection = convertStringToDate(startDate);

                    if (userSelection < startInpcIgpdi) {
                        const oldStartDate = startDate;
                        startDate = "01/07/1995";
                        getTjprBefore = monthDiff(
                            convertStringToDate(oldStartDate),
                            convertStringToDate(startDate)
                        );
                    }

                    for (const value of values) {
                        try {
                            dataArrays.push(await dataApi(value, startDate, endDate));
                        } catch (error) {
                            window.alert(
                                `Serviço indisponível no momento, tente novamente mais tarde.`
                            );
                            location.reload();
                        }
                    }
                    if (dataArrays[0].length !== dataArrays[1].length) {
                        if (dataArrays[0].length > dataArrays[1].length) {
                            dataArrays[0].pop();
                        } else {
                            dataArrays[1].pop();
                        }
                    }

                    let averageArray = dataArrays[0].map((item, index) => {
                        return {
                            data: item.data,
                            valor:
                                (parseFloat(item.valor) + parseFloat(dataArrays[1][index].valor)) / 2,
                        };
                    });

                    if (getTjprBefore > 0) {

                        const tempArray = [];
                        for (let i = 0; i < getTjprBefore; i++) {
                            tempArray.unshift({
                                data: tjprBefore[i].data,
                                valor: tjprBefore[i].valor,
                            });
                        }
                        averageArray.unshift.apply(averageArray, tempArray);
                    }

                    const result = await acummulatedIndex(averageArray, endDate);

                    averageArray = [];

                    return {
                        accumulatedIndex: parseFloat(result.accumulatedIndex),
                        baseDate: result.baseDate,
                    };
                } else {
                    try {
                        return await acummulatedIndex(
                            await dataApi(index, startDate, endDate),
                            endDate
                        );
                    } catch (error) {
                        window.alert(
                            `Serviço indisponível no momento, tente novamente mais tarde.`
                        );
                        location.reload();
                    }
                }
            };

            const acummulatedIndex = async (data, endDate) => {
                const modifiedArray = (data) => {
                    let jsonApiLastDate = data[data.length - 1].data;
                    const differMonths =
                        monthDiff(
                            convertStringToDate(endDate),
                            convertStringToDate(jsonApiLastDate)
                        );

                    if (differMonths === 0) {
                        baseDate = convertStringToDate(jsonApiLastDate);
                        data.pop();
                    }
                    if (differMonths === 1) {
                        baseDate = convertStringToDate(endDate);
                    }
                    if (differMonths > 1) {
                        baseDate = convertStringToDate(jsonApiLastDate);
                        baseDate.setMonth(baseDate.getMonth() + 1);
                    }
                    return data;
                }

                const indexNumber = (data) => {
                    let accumulatedIndex = 1;
                    data.reduceRight((_, item, i) => {
                        accumulatedIndex *= parseFloat(
                            (parseFloat(item.valor) / 100 + 1).toFixed(9)
                        );
                    }, []);

                    return accumulatedIndex;
                }
                const accumulatedIndex = indexNumber(modifiedArray(data));

                return {
                    accumulatedIndex: accumulatedIndex,
                    baseDate: baseDate,
                };
            };

            const adjustnumbers = await apiRequest(index, formattedStartDate, formattedEndDate);

            const result = getResult(financialValue, startDate, formattedStartDate, endDate, formattedEndDate, adjustnumbers, dates)

            const indexLabels = {
                inpc: "INPC",
                igpm: "IGP-M",
                ipca: "IPCA",
                tjpr: "TJPR",
            }

            const indexLabel = indexLabels[indexVal] ? indexLabels[indexVal] : indexVal.toUpperCase();

            this.results.push({
                label: "Principal",
                items: [
                    { label: "Data Inicial", value: formatDateResult(result.formattedStartDate) },
                    { label: "Data Final", value: formatDateResult(formatDate(adjustnumbers.baseDate.toISOString().slice(0, 10))) },
                    { label: "Valor Inicial", value: money(financialValue) },
                    { label: `Índice (${indexLabel})`, value: adjustnumbers.accumulatedIndex.toFixed(6) },
                    { label: "Valor Final", value: money(result.adjustedValue) }
                ]
            })

            if (result.months05Percent > 0) {
                this.results.push({
                    label: "Juros 0,5% a.m",
                    items: [
                        { label: "Data Inicial", value: formatDateResult(result.startDate05) },
                        { label: "Data Final", value: formatDateResult(result.endDate05) },
                        { label: "Período em Dias", value: (result.months05Percent ).toFixed(0) },
                        { label: "Percentual Período", value: `${(result.rate05Percent * 100).toFixed(2)}%` },
                        { label: "Valor Juros", value: money(result.interest05Percent) }
                    ]
                })
            }

            if (result.monthsOnePercent > 0) {
                this.results.push({
                    label: "Juros 1% a.m",
                    items: [
                        { label: "Data Inicial", value: formatDateResult(result.startDate1) },
                        { label: "Data Final", value: formatDateResult(result.endDate1) },
                        { label: "Período em Dias", value: (result.monthsOnePercent).toFixed(0) },
                        { label: "Percentual Período", value: `${(result.rateOnePercent * 100).toFixed(2)}%` },
                        { label: "Valor Juros", value: money(result.interestOnePercent) }
                    ]
                })
            }
            this.totalValue = money(result.adjustedValue + result.interest05Percent + result.interestOnePercent);
        } catch (error) {
            console.log()
            this.loading = false;
            window.alert(
                `Serviço indisponível no momento, tente novamente mais tarde.`
            );
        } finally {
            this.loading = false;
        }

    }

};

const money = (value) => {
    return `R$ ${String(Number(value).toFixed(2)).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

const formatDateResult = (dateStr) => {
    const splitted = dateStr.split("/");
    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const month = months[Number(splitted[1]) - 1];
    return `${month}/${splitted[2]}`;
}


const tjprBefore = [
    {
        data: "01/06/1995",
        valor: 1.82,
    },
    {
        data: "01/05/1995",
        valor: 2.57,
    },
    {
        data: "01/04/1995",
        valor: 1.92,
    },
    {
        data: "01/03/1995",
        valor: 1.41,
    },
    {
        data: "01/02/1995",
        valor: 0.99,
    },
    {
        data: "01/01/1995",
        valor: 1.67,
    },
    {
        data: "01/12/1994",
        valor: 2.19,
    },
    {
        data: "01/11/1994",
        valor: 3.27,
    },
    {
        data: "01/10/1994",
        valor: 1.86,
    },
    {
        data: "01/09/1994",
        valor: 1.51,
    },
    {
        data: "01/08/1994",
        valor: 5.46,
    },
];


const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

const getResult = (financialValue, startDate, formattedStartDate, endDate, formattedEndDate, adjustnumbers, dates) => {
    const adjustedValue = financialValue * adjustnumbers.accumulatedIndex;

    let startRateOnePercent = startDate;
    let startRate05Percent = startDate;

    let endRateOnePercent = endDate;
    let endRate05Percent = endDate;

    let months05Percent = 0;
    if (dates["0,5%"]) {
        startRate05Percent = dates["0,5%"]?.startDate;
        endRate05Percent = dates["0,5%"]?.endDate;
        months05Percent = thisMonthDiff(convertStringToDate(formatDate(startRate05Percent)),
            convertStringToDate(formatDate(endRate05Percent))) || 0;
    }

    let monthsOnePercent = 0;
    if (dates["1%"]) {
        startRateOnePercent = dates["1%"]?.startDate;
        endRateOnePercent = dates["1%"]?.endDate;
        monthsOnePercent = thisMonthDiff(convertStringToDate(formatDate(startRateOnePercent)),
            convertStringToDate(formatDate(endRateOnePercent))) || 0;
    }

    let rate05Percent, interest05Percent;
    const startDate05 = startRate05Percent ? formatDate(startRate05Percent) : null;
    const endDate05 = endRate05Percent ? formatDate(endRate05Percent) : null;
    if (months05Percent > 0) {
        rate05Percent = ((0.5 / 100) / 30) * months05Percent;
        interest05Percent = adjustedValue * rate05Percent;
    } else {
        rate05Percent = 0;
        interest05Percent = 0;
        months05Percent = 0;
    }

    let rateOnePercent, interestOnePercent;

    const startDate1 = startRateOnePercent ? formatDate(startRateOnePercent) : null;
    const endDate1 = endRateOnePercent ? formatDate(endRateOnePercent) : null;
    if (monthsOnePercent > 0) {
        rateOnePercent = ((1 / 100) / 30) * monthsOnePercent;
        interestOnePercent = adjustedValue * rateOnePercent;
    } else {
        rateOnePercent = 0;
        interestOnePercent = 0;
        monthsOnePercent = 0;
    }

    return {
        adjustedValue,
        interest05Percent,
        interestOnePercent,
        months05Percent,
        monthsOnePercent,
        rate05Percent,
        rateOnePercent,
        startDate05,
        startDate1,
        endDate05,
        endDate1,
        formattedStartDate,
        formattedEndDate
    }
}

const pause = (duration) => new Promise((res) => setTimeout(res, duration));

const thisMonthDiff = (d1, d2) => {
    const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
    const diffInTime = date2.getTime() - date1.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);
    return Math.abs(diffInDays);
}

const monthDiff = (date1, date2) => {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    const diffMonths = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
}

const convertStringToDate = (dateString) => {
    const dateParts = dateString.split("/");
    return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
}