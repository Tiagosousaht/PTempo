function calcular() {
    const salario = Number(document.getElementById("salario").value);
    const admissao = new Date(document.getElementById("admissao").value);
    const demissao = new Date(document.getElementById("demissao").value);
    const tipo = document.getElementById("tipo").value;
    const aviso = document.getElementById("aviso").value;

    if (!salario || isNaN(admissao.getTime()) || isNaN(demissao.getTime())) {
        alert("Preencha o salário e as datas corretamente.");
        return;
    }

    // 1. Cálculo de Meses/Anos
    const diffAnos = demissao.getFullYear() - admissao.getFullYear();
    const mesesTotais = (diffAnos * 12) + (demissao.getMonth() - admissao.getMonth());
    
    function calcularAvos(inicio, fim, is13o = false) {
        let dataAux = is13o ? new Date(fim.getFullYear(), 0, 1) : new Date(inicio);
        let meses = 0;
        while (dataAux < fim) {
            let proximoMes = new Date(dataAux.getFullYear(), dataAux.getMonth() + 1, dataAux.getDate());
            if (proximoMes <= fim) { meses++; }
            else {
                if (Math.floor((fim - dataAux) / (1000*60*60*24)) >= 15) meses++;
            }
            dataAux = proximoMes;
        }
        return meses;
    }

    const avosFerias = calcularAvos(admissao, demissao);
    const avos13 = calcularAvos(admissao, demissao, true);

    // 2. Verbas Principais
    const ultimoDia = new Date(demissao.getFullYear(), demissao.getMonth() + 1, 0).getDate();
    const saldoSalario = (salario / ultimoDia) * demissao.getDate();
    const v13 = (salario / 12) * avos13;
    const vFeriasTotal = ((salario / 12) * avosFerias) * 1.3333;

    // 3. Aviso Prévio Proporcional (30 dias + 3 por ano)
    let vAviso = 0;
    const diasAviso = 30 + (Math.min(Math.floor(mesesTotais / 12), 20) * 3);
    if (aviso === "indenizado") {
        vAviso = (salario / 30) * diasAviso;
        if (tipo === "acordo") vAviso /= 2;
    } else if (aviso === "nao_cumprido") {
        vAviso = -salario;
    }

    // 4. FGTS de Todo o Período
    const fgtsMes = (saldoSalario + v13) * 0.08;
    const fgtsAcumulado = (salario * 0.08) * mesesTotais;
    const baseMulta = fgtsAcumulado + fgtsMes;
    
    let multa = 0;
    if (tipo === "sem") multa = baseMulta * 0.40;
    else if (tipo === "acordo") multa = baseMulta * 0.20;

    // 5. INSS
    const inss = (v) => v <= 1412 ? v * 0.075 : v <= 2666 ? (v * 0.09) - 21 : (v * 0.12) - 101;
    const descInss = inss(saldoSalario) + inss(v13);

    // Totais
    const totalRescisao = (saldoSalario + v13 + vFeriasTotal + vAviso + multa + fgtsMes) - descInss;
    const saqueCaixa = totalRescisao + fgtsAcumulado;

    // Renderização
    document.getElementById("resultado").innerHTML = `
        <div class="result-card">
            <div class="linha"><span>Saldo de Salário</span><strong>R$ ${saldoSalario.toFixed(2)}</strong></div>
            <div class="linha"><span>13º Proporcional</span><strong>R$ ${v13.toFixed(2)}</strong></div>
            <div class="linha"><span>Férias + 1/3</span><strong>R$ ${vFeriasTotal.toFixed(2)}</strong></div>
            <div class="linha"><span>FGTS do Mês + Multa</span><strong>R$ ${(fgtsMes + multa).toFixed(2)}</strong></div>
            <div class="linha"><span>Descontos (INSS)</span><strong style="color:var(--danger)">- R$ ${descInss.toFixed(2)}</strong></div>
            
            <div class="total-box">
                <span>VALOR DA RESCISÃO</span>
                <h2>R$ ${totalRescisao.toFixed(2)}</h2>
            </div>

            <div class="fgts-info">
                <p><strong>💰 FGTS Acumulado: R$ ${fgtsAcumulado.toFixed(2)}</strong></p>
                <p style="font-size: 11px; margin-top: 4px;">Disponível para saque na Caixa Econômica.</p>
            </div>
        </div>
    `;

    // Salva para o PDF
    window.lastCalc = { saldoSalario, v13, vFeriasTotal, vAviso, multa, fgtsMes, descInss, totalRescisao, fgtsAcumulado, saqueCaixa };
    document.getElementById("btnPDF").disabled = false;
}

function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const d = window.lastCalc;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 82, 255);
    doc.text("MeuAcerto - Detalhes da Rescisão", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    
    const dados = [
        ["Saldo de Salário", d.saldoSalario],
        ["13º Proporcional", d.v13],
        ["Férias + 1/3", d.vFeriasTotal],
        ["Aviso Prévio", d.vAviso],
        ["Multa Rescisória", d.multa],
        ["FGTS do Mês", d.fgtsMes],
        ["Descontos INSS", -d.descInss]
    ];

    let y = 40;
    dados.forEach(p => {
        doc.text(p[0], 20, y);
        doc.text(`R$ ${p[1].toFixed(2)}`, 140, y);
        y += 10;
    });

    doc.line(20, y, 180, y);
    y += 15;
    
    doc.setFont("helvetica", "bold");
    doc.text("Total Líquido Rescisão:", 20, y);
    doc.text(`R$ ${d.totalRescisao.toFixed(2)}`, 140, y);
    
    y += 10;
    doc.setTextColor(5, 150, 105);
    doc.text("Saldo FGTS Anterior (Caixa):", 20, y);
    doc.text(`R$ ${d.fgtsAcumulado.toFixed(2)}`, 140, y);

    doc.save("rescisao-meuacerto.pdf");
}
