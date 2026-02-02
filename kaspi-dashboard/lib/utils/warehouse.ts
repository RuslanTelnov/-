
// Функция определения склада по названию
export const getWarehouseName = (storeName: string): string => {
    if (!storeName || storeName.trim() === '') {
        return 'Основной склад'
    }

    const name = storeName.toLowerCase().trim()

    // Склад Китай - различные варианты
    if (name.includes('китай') || name.includes('china') || name.includes('cn') ||
        name.includes('chinese') || name.includes('кит') || name.includes('cn-')) {
        return 'Склад Китай'
    }

    // Склад предзаказов
    if (name.includes('предзаказ') || name.includes('preorder') || name.includes('pre-order') ||
        name.includes('пред') || name.includes('резерв') || name.includes('reserve')) {
        return 'Склад предзаказов'
    }


    // Склад транзит
    if (name.includes('транзит') || name.includes('transit')) {
        return 'Склад транзит'
    }

    // Товар в пути (объединяем со Складом транзит для отображения на дашборде)
    if (name.includes('в пути') || name.includes('доставка') || name.includes('delivery') || name.includes('в дороге')) {
        return 'Склад транзит'
    }


    // Основной склад (строгое соответствие)
    if (name === 'основной склад' || name === 'main warehouse') {
        return 'Основной склад'
    }

    // Все остальные склады
    return 'Прочие'
}
