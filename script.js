
//const proxyUrl = 'http://localhost:3000/'
 const proxyUrl = 'https://proxy.cors.sh/'

async function findParts() {
  const vin = document.getElementById('vinInput').value;
  const resultDiv = document.getElementById('result');
  
  if (!vin) {
      resultDiv.innerHTML = '<p>Пожалуйста, введите VIN автомобиля.</p>';
      return;
  }

  resultDiv.innerHTML = '<p>Загрузка...</p>';
  
  try {
    const targetUrl = `https://catalogoriginal.autodoc.ru/api/catalogs/original/cars/${vin}/modifications?clientid=375`;
    
    const response = await fetch(proxyUrl + targetUrl, {
        headers: {
            'x-cors-api-key': 'temp_31313ff9ce6738a80ecdc159a70d05c0',
            'Origin': 'http://127.0.0.1:5500'
        }
    });
      
      if (!response.ok) {
          throw new Error('Ошибка при получении данных.');
      }
      
      const data = await response.json();
 
      if (data && data.commonAttributes && data.commonAttributes.length > 0) {
        const attributes = data.commonAttributes.map(attr => `
            <div class="attribute">
                <strong>${attr.name}:</strong> ${attr.value || 'Не указано'}
            </div>
        `).join('');
        resultDiv.innerHTML = `
            <h3>Результаты по VIN: ${vin}</h3>
            ${attributes}
        `;
        const catalogAttr = data.commonAttributes.find(attr => attr.key === 'Catalog');
        const ssdAttr = data.commonAttributes.find(attr => attr.key === 'Ssd');
        
        if (catalogAttr && ssdAttr) {
            const catalog = catalogAttr.value;
            const ssd = ssdAttr.value;

            // Второй запрос: получение категорий по catalog и ssd

            const targetUrl2 = `https://catalogoriginal.autodoc.ru/api/catalogs/original/brands/${catalog}/cars/0/categories?ssd=${encodeURIComponent(ssd)}`

            const secondResponse = await fetch(proxyUrl + targetUrl2, {
                headers: {
                    'x-cors-api-key': 'temp_31313ff9ce6738a80ecdc159a70d05c0',
                    'Origin': 'http://127.0.0.1:5500'
                }
            });
            
          

            if (!secondResponse.ok) {
                throw new Error('Ошибка при получении данных о категориях.');
            }

            const secondData = await secondResponse.json();
            
            // Отображаем результаты второго запроса (если они есть)
            if (secondData.items && secondData.items.length > 0) {
              const categoryNames = secondData.items.map(item => `
                <div class="categories">
                  <div class="category" onclick="getUnits('${catalog}', '${item.categoryId}', '${encodeURIComponent(item.ssd)}')">
                      ${item.name}
                  </div>
              </div>`).join('');
              resultDiv.innerHTML += `
                  <h3>Категории для автомобиля:</h3>
                  ${categoryNames}
              `;
          } else {
              resultDiv.innerHTML += '<p>Категории не найдены.</p>';
          }
      } else {
          resultDiv.innerHTML += '<p>Каталог или SSD не найдены.</p>';
      }

    } else {
        resultDiv.innerHTML = '<p>Данные по данному VIN не найдены.</p>';
    }
} catch (error) {
    resultDiv.innerHTML = `<p>Произошла ошибка: ${error.message}</p>`;
}
  }
  async function getUnits(catalog, categoryId, ssd) {
    const resultDiv = document.getElementById('result');

    try {
        // Третий запрос: получение узлов по категории
        const targetUrl3 = `https://catalogoriginal.autodoc.ru/api/catalogs/original/brands/${catalog}/cars/0/categories/${categoryId}/units?ssd=${ssd}`


        const thirdResponse = await fetch(proxyUrl + targetUrl3, {
          headers: {
            'x-cors-api-key': 'temp_31313ff9ce6738a80ecdc159a70d05c0',
              'Origin': 'http://127.0.0.1:5500'
          }
        });
        
        if (!thirdResponse.ok) {
            throw new Error('Ошибка при получении узлов.');
        }

        const thirdData = await thirdResponse.json();
        
        // Обрабатываем данные третьего запроса
        if (thirdData.items && thirdData.items.length > 0) {
            const unitImages = thirdData.items.map(item => {
                const imageUrl = item.imageUrl.replace('%size%', 'source'); // Заменяем %size% на 'source'
                return `
                    <div class="image-container" onclick="getSpareParts('${catalog}', '${item.unitId}', '${encodeURIComponent(item.ssd)}', '${imageUrl}')">
                        <img src="${imageUrl}" alt="${item.name}">
                        <p>${item.name}</p>
                    </div>
                `;
            }).join('');
            resultDiv.innerHTML = ``
            resultDiv.innerHTML += `
                <h3>Узлы для категории:</h3>
                <div class="image-grid">${unitImages}</div>
            `;
        } else {
            resultDiv.innerHTML += '<p>Узлы не найдены.</p>';
        }

    } catch (error) {
        resultDiv.innerHTML = `<p>Произошла ошибка при получении узлов: ${error.message}</p>`;
    }
}
      async function getSpareParts(catalog, unitId, ssd2, imageUrl) {
        const resultDiv = document.getElementById('result');
            console.log(imageUrl)

  try {
      // Четвертый запрос: получение запчастей по unitId
      const targetUrl4 = `https://catalogoriginal.autodoc.ru/api/catalogs/original/brands/${catalog}/cars/0/units/${unitId}/spareparts?ssd=${ssd2}`;

      const fourthResponse = await fetch(proxyUrl + targetUrl4, {
        method: 'POST',
        headers: {
            'x-cors-api-key': 'temp_31313ff9ce6738a80ecdc159a70d05c0',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': 'http://127.0.0.1:5500'
        },
        body: `{"Ssd":"${decodeURIComponent(ssd2)}"}`,
      });

      if (!fourthResponse.ok) {
          throw new Error('Ошибка при получении запасных частей.');
      }

      const fourthData = await fourthResponse.json();

      // Обрабатываем и отображаем запасные части
      if (fourthData.items && fourthData.items.length > 0) {
        // Заменяем {%size%} на текстовое значение 'source' в URL картинки
        const imageSrc = imageUrl.replace('%size%', 'source');

        // Добавляем картинку перед списком запчастей
        let htmlContent = `
            <div class="unit-image">
                <img src="${imageSrc}" alt="Изображение узла">
            </div>
            <h3>Запасные части для узла:</h3>
            <div class="spare-parts-list">
        `;

        const spareParts = fourthData.items.map(part => {
            const noteAttribute = part.attributes.find(attr => attr.key === 'note');
            const codeOnImage = part.codeOnImage !== "-" ? part.codeOnImage : "Без кода";
            return `
                <div class="spare-part">
                    <span><strong>${codeOnImage}:</strong> ${part.name}</span>
                    <span><strong>Номер детали:</strong> ${part.partNumber || 'Не указан'}</span>
                    <span><strong>Примечание:</strong> ${noteAttribute ? noteAttribute.value : 'Примечание отсутствует'}</span>
                </div>
            `;
        }).join('');

        htmlContent += spareParts + '</div>';
        resultDiv.innerHTML = ``
        resultDiv.innerHTML += htmlContent;
    } else {
        resultDiv.innerHTML += '<p>Запасные части не найдены.</p>';
    }

} catch (error) {
    resultDiv.innerHTML = `<p>Произошла ошибка при получении запасных частей: ${error.message}</p>`;
}
}