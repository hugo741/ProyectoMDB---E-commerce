FROM php:8.1-apacheo

# Dependencias y extension de MongoDB
RUN apt-get update && apt-get install -y \
        git unzip libssl-dev libcurl4-openssl-dev pkg-config \
    && pecl install mongodb \
    && docker-php-ext-enable mongodb \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer globalmente
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

RUN a2enmod rewrite

COPY ./web/composer.json ./web/composer.lock* ./

# Dependencias PHP
RUN composer install --no-dev --optimize-autoloader --ignore-platform-req=ext-mongodb

# Copiar codigo
COPY ./web/ ./

EXPOSE 80
