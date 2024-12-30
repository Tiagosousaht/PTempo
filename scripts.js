

const key = "055543d706fb2e200510b9939e7857f6"

function colocarDadosNaTela(dados) {
    console.log(dados);
    document.querySelector(".cidade").innerHTML = "Tempo em " + dados.name;
    document.querySelector(".temp").innerHTML = `${Math.floor(dados.main.temp)}°C`;
    document.querySelector(".texto-previsao").innerHTML = dados.weather[0].description;
    document.querySelector(".umidade").innerHTML = `${dados.main.humidity}%`;
    document.querySelector(".img_previsao").src = `https://openweathermap.org/img/wn/${dados.weather[0].icon}.png`;

}



async function buscarCidade(cidade) {
    const dados = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${key}&lang=pt_br&units=metric`)
        .then(resposta => resposta.json());

    colocarDadosNaTela(dados);
}


function cliqueiNoBotao() {
    const cidade = document.querySelector(".input-cidade").value

    buscarCidade(cidade)
}



async function buscarCidade(cidade) {
    document.querySelector(".cidade").innerHTML = "Carregando...";
    try {
        const resposta = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${key}&lang=pt_br&units=metric`);
        if (!resposta.ok) throw new Error("Cidade não encontrada");

        const dados = await resposta.json();
        colocarDadosNaTela(dados);
    } catch (erro) {
        console.error("Erro ao buscar a cidade:", erro);
        document.querySelector(".cidade").innerHTML = "Cidade não encontrada";
        document.querySelector(".temp").innerHTML = "";
        document.querySelector(".texto-previsao").innerHTML = "";
        document.querySelector(".Umidade").innerHTML = "";
    }
}
