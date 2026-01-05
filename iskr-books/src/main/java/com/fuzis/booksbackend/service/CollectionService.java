package com.fuzis.booksbackend.service;

import com.fuzis.booksbackend.entity.*;
import com.fuzis.booksbackend.entity.enumerate.CollectionType;
import com.fuzis.booksbackend.entity.enumerate.Confidentiality;
import com.fuzis.booksbackend.entity.enumerate.CvpStatus;
import com.fuzis.booksbackend.repository.*;
import com.fuzis.booksbackend.transfer.*;
import com.fuzis.booksbackend.transfer.state.State;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CollectionService {

    private final BookCollectionRepository bookCollectionRepository;
    private final BooksBookCollectionsRepository booksBookCollectionsRepository;
    private final LikedCollectionRepository likedCollectionRepository;
    private final CollectionViewPrivilegeRepository collectionViewPrivilegeRepository;
    private final BookRepository bookRepository;
    private final ImageLinkRepository imageLinkRepository;
    private final UserRepository userRepository;
    private final BookReviewRepository bookReviewRepository;
    private final AuthorRepository authorRepository;
    private final GenreRepository genreRepository;
    private final CollectionAccessRepository collectionAccessRepository;

    @Transactional(readOnly = true)
    public ChangeDTO<Object> getCollectionDetail(Integer collectionId, Integer userId) {
        try {
            log.debug("Getting collection details for ID: {}, userId: {}", collectionId, userId);

            // Проверяем доступ к коллекции
            Boolean canView = checkCollectionAccess(collectionId, userId);
            if (Boolean.FALSE.equals(canView)) {
                log.warn("Access denied to collection {} for user {}", collectionId, userId);
                return new ChangeDTO<>(State.Fail_Forbidden, "Access to collection denied", null);
            }

            // Получаем коллекцию с владельцем и фото
            Optional<BookCollection> collectionOpt = bookCollectionRepository.findByIdWithOwnerAndPhoto(collectionId);
            if (collectionOpt.isEmpty()) {
                log.warn("Collection not found with ID: {}", collectionId);
                return new ChangeDTO<>(State.Fail_NotFound, "Collection not found", null);
            }

            BookCollection collection = collectionOpt.get();

            // Получаем количество книг в коллекции
            List<Object[]> bookCounts = booksBookCollectionsRepository.findBookCountsByCollectionIds(List.of(collectionId));
            Long booksCount = bookCounts.isEmpty() ? 0L : (Long) bookCounts.get(0)[1];

            // Получаем количество лайков на коллекции
            List<Object[]> likesResults = likedCollectionRepository.findPopularCollections();
            Map<Integer, Long> likesMap = likesResults.stream()
                    .collect(Collectors.toMap(
                            row -> (Integer) row[0],
                            row -> (Long) row[1]
                    ));
            Long likesCount = likesMap.getOrDefault(collectionId, 0L);

            // Получаем информацию о владельце
            String ownerNickname = null;
            if (collection.getOwner() != null) {
                List<User> owners = userRepository.findByIdsWithProfiles(List.of(collection.getOwner().getUserId()));
                if (!owners.isEmpty() && owners.get(0).getProfile() != null) {
                    ownerNickname = owners.get(0).getProfile().getNickname();
                }
            }

            // Получаем изображение коллекции
            ImageLinkDTO photoLinkDTO = null;
            if (collection.getPhotoLink() != null) {
                Integer imageLinkId = collection.getPhotoLink().getImglId();
                List<ImageLink> imageLinks = imageLinkRepository.findByIdsWithImageData(List.of(imageLinkId));
                if (!imageLinks.isEmpty()) {
                    ImageLink imageLink = imageLinks.get(0);
                    if (imageLink.getImageData() != null) {
                        ImageData imageData = imageLink.getImageData();
                        ImageDataDTO imageDataDTO = new ImageDataDTO(
                                imageData.getImgdId(),
                                imageData.getUuid(),
                                imageData.getSize(),
                                imageData.getMimeType(),
                                imageData.getExtension()
                        );
                        photoLinkDTO = new ImageLinkDTO(imageLink.getImglId(), imageDataDTO);
                    }
                }
            }

            // Создаем DTO
            CollectionDetailDTO dto = new CollectionDetailDTO();
            dto.setCollectionId(collection.getBcolsId());
            dto.setTitle(collection.getTitle());
            dto.setDescription(collection.getDescription());
            dto.setConfidentiality(collection.getConfidentiality().name());
            dto.setCollectionType(collection.getCollectionType().name());
            dto.setPhotoLink(photoLinkDTO);
            dto.setOwnerId(collection.getOwner() != null ? collection.getOwner().getUserId() : null);
            dto.setOwnerNickname(ownerNickname);
            dto.setBooksCount(booksCount);
            dto.setLikesCount(likesCount);
            dto.setCanView(true); // Если дошли сюда, значит доступ есть

            log.debug("Collection details retrieved for ID: {}", collectionId);
            return new ChangeDTO<>(State.OK, "Collection details retrieved successfully", dto);

        } catch (Exception e) {
            log.error("Error retrieving collection details for ID {}: ", collectionId, e);
            return new ChangeDTO<>(State.Fail, "Error retrieving collection details: " + e.getMessage(), null);
        }
    }

    @Transactional(readOnly = true)
    public ChangeDTO<Object> getCollectionBooks(Integer collectionId, Integer userId, Integer page, Integer batch) {
        try {
            log.debug("Getting books for collection ID: {}, userId: {}, page: {}, batch: {}",
                    collectionId, userId, page, batch);

            // Проверяем доступ к коллекции
            Boolean canView = checkCollectionAccess(collectionId, userId);
            if (Boolean.FALSE.equals(canView)) {
                log.warn("Access denied to collection {} for user {}", collectionId, userId);
                return new ChangeDTO<>(State.Fail_Forbidden, "Access to collection denied", null);
            }

            if (page == null || page < 0) {
                page = 0;
            }
            if (batch == null || batch <= 0) {
                batch = 10;
            }

            Pageable pageable = PageRequest.of(page, batch);

            // Получаем связи книг с коллекцией
            Page<BooksBookCollections> booksInCollectionPage = getBooksInCollectionPage(collectionId, pageable);

            // Извлекаем ID книг
            List<Integer> bookIds = booksInCollectionPage.getContent().stream()
                    .map(bbc -> bbc.getBook().getBookId())
                    .collect(Collectors.toList());

            // Получаем книги с авторами и жанрами
            List<Book> books = bookRepository.findAllById(bookIds);

            // Получаем средние рейтинги
            List<Object[]> averageRatingsResults = bookReviewRepository.findAverageRatingsByBookIds(bookIds);
            Map<Integer, Double> averageRatingsMap = averageRatingsResults.stream()
                    .collect(Collectors.toMap(
                            row -> (Integer) row[0],
                            row -> (Double) row[1]
                    ));

            // Получаем ID изображений
            List<Integer> imageIds = books.stream()
                    .map(Book::getPhotoLink)
                    .filter(Objects::nonNull)
                    .map(ImageLink::getImglId)
                    .collect(Collectors.toList());

            // Получаем изображения с данными
            Map<Integer, ImageLink> imageLinksMap;
            if (!imageIds.isEmpty()) {
                List<ImageLink> imageLinks = imageLinkRepository.findByIdsWithImageData(imageIds);
                imageLinksMap = imageLinks.stream()
                        .collect(Collectors.toMap(ImageLink::getImglId, il -> il));
            } else {
                imageLinksMap = new HashMap<>();
            }

            // Преобразуем в DTO
            List<BookInCollectionDTO> bookDTOs = books.stream()
                    .map(book -> {
                        BookInCollectionDTO dto = new BookInCollectionDTO();
                        dto.setBookId(book.getBookId());
                        dto.setTitle(book.getTitle());
                        dto.setSubtitle(book.getSubtitle());
                        dto.setIsbn(book.getIsbn());
                        dto.setPageCnt(book.getPageCnt());
                        dto.setDescription(book.getDescription());

                        // Средний рейтинг
                        Double avgRating = averageRatingsMap.get(book.getBookId());
                        if (avgRating != null) {
                            dto.setAverageRating(Math.round(avgRating * 100.0) / 100.0);
                        }

                        // Изображение книги
                        ImageLink photoLink = book.getPhotoLink();
                        if (photoLink != null) {
                            ImageLink fullImageLink = imageLinksMap.get(photoLink.getImglId());
                            if (fullImageLink != null && fullImageLink.getImageData() != null) {
                                ImageData imageData = fullImageLink.getImageData();
                                ImageDataDTO imageDataDTO = new ImageDataDTO(
                                        imageData.getImgdId(),
                                        imageData.getUuid(),
                                        imageData.getSize(),
                                        imageData.getMimeType(),
                                        imageData.getExtension()
                                );
                                ImageLinkDTO imageLinkDTO = new ImageLinkDTO(
                                        fullImageLink.getImglId(),
                                        imageDataDTO
                                );
                                dto.setPhotoLink(imageLinkDTO);
                            }
                        }

                        // Авторы
                        if (book.getAuthors() != null) {
                            List<AuthorDTO> authorDTOs = book.getAuthors().stream()
                                    .map(author -> new AuthorDTO(
                                            author.getAuthorId(),
                                            author.getName(),
                                            author.getRealName()
                                    ))
                                    .collect(Collectors.toList());
                            dto.setAuthors(authorDTOs);
                        }

                        // Жанры
                        if (book.getGenres() != null) {
                            List<GenreDTO> genreDTOs = book.getGenres().stream()
                                    .map(genre -> new GenreDTO(
                                            genre.getGenreId(),
                                            genre.getName()
                                    ))
                                    .collect(Collectors.toList());
                            dto.setGenres(genreDTOs);
                        }

                        return dto;
                    })
                    .collect(Collectors.toList());

            // Сортируем по ID книги для сохранения порядка из пагинации
            Map<Integer, BookInCollectionDTO> bookMap = bookDTOs.stream()
                    .collect(Collectors.toMap(BookInCollectionDTO::getBookId, dto -> dto));

            List<BookInCollectionDTO> sortedBookDTOs = bookIds.stream()
                    .map(bookMap::get)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("collectionId", collectionId);
            response.put("page", page);
            response.put("batch", batch);
            response.put("totalPages", booksInCollectionPage.getTotalPages());
            response.put("totalElements", booksInCollectionPage.getTotalElements());
            response.put("books", sortedBookDTOs);
            response.put("canView", true);

            if (sortedBookDTOs.isEmpty()) {
                log.debug("No books found in collection {}", collectionId);
                return new ChangeDTO<>(State.OK, "No books found in collection", response);
            }

            log.debug("Found {} books in collection {}", sortedBookDTOs.size(), collectionId);
            return new ChangeDTO<>(State.OK, "Books retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error retrieving books for collection {}: ", collectionId, e);
            return new ChangeDTO<>(State.Fail, "Error retrieving books: " + e.getMessage(), null);
        }
    }

    @Transactional
    public ChangeDTO<Object> createCollection(Integer userId, CollectionRequestDTO dto) {
        try {
            log.info("Creating collection by user ID: {}", userId);

            // Проверяем, что userId не null (только зарегистрированные пользователи могут создавать коллекции)
            if (userId == null) {
                log.warn("User ID is null for collection creation");
                return new ChangeDTO<>(State.Fail_Forbidden, "Only registered users can create collections", null);
            }

            // Проверяем существование пользователя
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.warn("User not found with ID: {}", userId);
                return new ChangeDTO<>(State.Fail_NotFound, "User not found", null);
            }

            // Валидация confidentiality
            try {
                Confidentiality.valueOf(dto.getConfidentiality());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid confidentiality value: {}", dto.getConfidentiality());
                return new ChangeDTO<>(State.Fail_BadData, "Invalid confidentiality value", null);
            }

            // Валидация collectionType
            try {
                CollectionType.valueOf(dto.getCollectionType());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid collection type value: {}", dto.getCollectionType());
                return new ChangeDTO<>(State.Fail_BadData, "Invalid collection type value", null);
            }

            // Проверяем photoLink если указан
            ImageLink photoLink = null;
            if (dto.getPhotoLink() != null) {
                Optional<ImageLink> photoLinkOpt = imageLinkRepository.findById(dto.getPhotoLink());
                if (photoLinkOpt.isEmpty()) {
                    log.warn("ImageLink not found with ID: {}", dto.getPhotoLink());
                    return new ChangeDTO<>(State.Fail_NotFound, "Image with specified photo link does not exist", null);
                }
                photoLink = photoLinkOpt.get();
            }

            // Создаем коллекцию
            BookCollection collection = BookCollection.builder()
                    .owner(userOpt.get())
                    .title(dto.getTitle())
                    .description(dto.getDescription())
                    .confidentiality(Confidentiality.valueOf(dto.getConfidentiality()))
                    .collectionType(CollectionType.valueOf(dto.getCollectionType()))
                    .photoLink(photoLink)
                    .build();

            BookCollection savedCollection = bookCollectionRepository.save(collection);
            log.info("Collection created with ID: {}", savedCollection.getBcolsId());

            // Возвращаем детали созданной коллекции
            return getCollectionDetail(savedCollection.getBcolsId(), userId);

        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation when creating collection: ", e);
            return handleDataIntegrityViolation(e);
        } catch (Exception e) {
            log.error("Error creating collection: ", e);
            return new ChangeDTO<>(State.Fail, "Error creating collection: " + e.getMessage(), null);
        }
    }

    @Transactional
    public ChangeDTO<Object> updateCollection(Integer userId, Integer collectionId, CollectionRequestDTO dto) {
        try {
            log.info("Updating collection ID: {} by user ID: {}", collectionId, userId);

            // Получаем коллекцию
            Optional<BookCollection> collectionOpt = bookCollectionRepository.findById(collectionId);
            if (collectionOpt.isEmpty()) {
                log.warn("Collection not found with ID: {}", collectionId);
                return new ChangeDTO<>(State.Fail_NotFound, "Collection not found", null);
            }

            BookCollection collection = collectionOpt.get();

            // Проверяем права доступа (только владелец или администратор)
            if (!hasCollectionAccess(collection, userId)) {
                log.warn("User {} has no access to update collection {}", userId, collectionId);
                return new ChangeDTO<>(State.Fail_Forbidden, "Invalid user", null);
            }

            // Обновляем поля, если они предоставлены и не пустые
            if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
                collection.setTitle(dto.getTitle());
            }

            // Для description проверяем на null, но разрешаем пустую строку
            if (dto.getDescription() != null) {
                collection.setDescription(dto.getDescription());
            }

            if (dto.getConfidentiality() != null && !dto.getConfidentiality().isBlank()) {
                try {
                    collection.setConfidentiality(Confidentiality.valueOf(dto.getConfidentiality()));
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid confidentiality value: {}", dto.getConfidentiality());
                    return new ChangeDTO<>(State.Fail_BadData,
                            "Invalid confidentiality value. Must be one of: Public, Private", null);
                }
            }

            if (dto.getCollectionType() != null && !dto.getCollectionType().isBlank()) {
                try {
                    collection.setCollectionType(CollectionType.valueOf(dto.getCollectionType()));
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid collection type value: {}", dto.getCollectionType());
                    return new ChangeDTO<>(State.Fail_BadData,
                            "Invalid collection type value. Must be one of: Standard, Liked, Wishlist", null);
                }
            }

            // Обновляем photoLink если предоставлен
            if (dto.getPhotoLink() != null) {
                Optional<ImageLink> photoLinkOpt = imageLinkRepository.findById(dto.getPhotoLink());
                if (photoLinkOpt.isPresent()) {
                    collection.setPhotoLink(photoLinkOpt.get());
                } else {
                    log.warn("ImageLink not found with ID: {}", dto.getPhotoLink());
                    return new ChangeDTO<>(State.Fail_NotFound,
                            "Image with specified photo link does not exist", null);
                }
            }

            BookCollection updatedCollection = bookCollectionRepository.save(collection);
            log.info("Collection updated with ID: {}", collectionId);

            // Возвращаем обновленные детали коллекции
            return getCollectionDetail(collectionId, userId);

        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation when updating collection: ", e);
            return handleDataIntegrityViolation(e);
        } catch (Exception e) {
            log.error("Error updating collection: ", e);
            return new ChangeDTO<>(State.Fail, "Error updating collection: " + e.getMessage(), null);
        }
    }

    // Новый метод: проверка, лайкнул ли пользователь коллекцию
    @Transactional(readOnly = true)
    public ChangeDTO<Object> checkIfLikedCollection(Integer userId, Integer collectionId) {
        try {
            log.debug("Checking if user {} liked collection {}", userId, collectionId);

            // Проверяем, что userId не null
            if (userId == null) {
                log.warn("User ID is null for checking like status");
                return new ChangeDTO<>(State.Fail_Forbidden, "User ID is required", null);
            }

            // Проверяем существование пользователя
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.warn("User not found with ID: {}", userId);
                return new ChangeDTO<>(State.Fail_NotFound, "User not found", null);
            }

            // Проверяем существование коллекции
            Optional<BookCollection> collectionOpt = bookCollectionRepository.findById(collectionId);
            if (collectionOpt.isEmpty()) {
                log.warn("Collection not found with ID: {}", collectionId);
                return new ChangeDTO<>(State.Fail_NotFound, "Collection not found", null);
            }

            // Проверяем, лайкнул ли пользователь коллекцию
            boolean isLiked = likedCollectionRepository.existsByUserIdAndCollectionId(userId, collectionId);

            Map<String, Object> response = new HashMap<>();
            response.put("collectionId", collectionId);
            response.put("userId", userId);
            response.put("isLiked", isLiked);

            log.debug("Like check result for user {} on collection {}: {}", userId, collectionId, isLiked);
            return new ChangeDTO<>(State.OK, "Like status retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error checking like status: ", e);
            return new ChangeDTO<>(State.Fail, "Error checking like status: " + e.getMessage(), null);
        }
    }

    // Новый метод: получение всех CVP коллекции
    @Transactional(readOnly = true)
    public ChangeDTO<Object> getCollectionPrivileges(Integer userId, Integer collectionId) {
        try {
            log.debug("Getting privileges for collection ID: {} by user ID: {}", collectionId, userId);

            // Получаем коллекцию
            Optional<BookCollection> collectionOpt = bookCollectionRepository.findById(collectionId);
            if (collectionOpt.isEmpty()) {
                log.warn("Collection not found with ID: {}", collectionId);
                return new ChangeDTO<>(State.Fail_NotFound, "Collection not found", null);
            }

            BookCollection collection = collectionOpt.get();

            // Проверяем права доступа (только владелец или администратор)
            if (!hasCollectionAccess(collection, userId)) {
                log.warn("User {} has no access to view privileges for collection {}", userId, collectionId);
                return new ChangeDTO<>(State.Fail_Forbidden, "Invalid user", null);
            }

            // Получаем все CVP для коллекции
            List<CollectionViewPrivilege> privileges = collectionViewPrivilegeRepository
                    .findByBcolsId(collectionId);

            // Преобразуем в DTO
            List<CollectionPrivilegeDTO> privilegeDTOs = privileges.stream()
                    .map(this::convertToCollectionPrivilegeDTO)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("collectionId", collectionId);
            response.put("totalPrivileges", privilegeDTOs.size());
            response.put("privileges", privilegeDTOs);

            log.debug("Retrieved {} privileges for collection {}", privilegeDTOs.size(), collectionId);
            return new ChangeDTO<>(State.OK, "Privileges retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error retrieving collection privileges: ", e);
            return new ChangeDTO<>(State.Fail, "Error retrieving privileges: " + e.getMessage(), null);
        }
    }

    // Вспомогательный метод: преобразование CVP в DTO
    private CollectionPrivilegeDTO convertToCollectionPrivilegeDTO(CollectionViewPrivilege privilege) {
        CollectionPrivilegeDTO dto = new CollectionPrivilegeDTO();
        dto.setCvpId(privilege.getCvpId());
        dto.setCollectionId(privilege.getBcolsId());
        dto.setUserId(privilege.getUserId());
        dto.setStatus(privilege.getStatus().name());

        // Получаем информацию о пользователе
        Optional<User> userOpt = userRepository.findById(privilege.getUserId());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            dto.setUsername(user.getUsername());

            // Получаем профиль пользователя для nickname
            List<User> usersWithProfiles = userRepository.findByIdsWithProfiles(List.of(user.getUserId()));
            if (!usersWithProfiles.isEmpty() && usersWithProfiles.get(0).getProfile() != null) {
                dto.setNickname(usersWithProfiles.get(0).getProfile().getNickname());
            }
        }

        return dto;
    }

    @Transactional
    public ChangeDTO<Object> deleteCollection(Integer userId, Integer collectionId) {
        try {
            log.info("Deleting collection ID: {} by user ID: {}", collectionId, userId);

            // Получаем коллекцию
            Optional<BookCollection> collectionOpt = bookCollectionRepository.findById(collectionId);
            if (collectionOpt.isEmpty()) {
                log.warn("Collection not found with ID: {}", collectionId);
                return new ChangeDTO<>(State.Fail_NotFound, "Collection not found", null);
            }

            BookCollection collection = collectionOpt.get();

            // Проверяем права доступа (только владелец или администратор)
            if (!hasCollectionAccess(collection, userId)) {
                log.warn("User {} has no access to delete collection {}", userId, collectionId);
                return new ChangeDTO<>(State.Fail_Forbidden, "Invalid user", null);
            }

            // Удаляем коллекцию
            bookCollectionRepository.delete(collection);
            log.info("Collection deleted with ID: {}", collectionId);

            return new ChangeDTO<>(State.OK, "Collection deleted successfully", null);

        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation when deleting collection: ", e);
            return handleDataIntegrityViolation(e);
        } catch (Exception e) {
            log.error("Error deleting collection: ", e);
            return new ChangeDTO<>(State.Fail, "Error deleting collection: " + e.getMessage(), null);
        }
    }

    @Transactional
    public ChangeDTO<Object> addBookToCollection(Integer userId, Integer collectionId, Integer bookId) {
        try {
            log.info("Adding book {} to collection {} by user {}", bookId, collectionId, userId);

            // Получаем коллекцию
            Optional<BookCollection> collectionOpt = bookCollectionRepository.findById(collectionId);
            if (collectionOpt.isEmpty()) {
                log.warn("Collection not found with ID: {}", collectionId);
                return new ChangeDTO<>(State.Fail_NotFound, "Collection not found", null);
            }

            BookCollection collection = collectionOpt.get();

            // Проверяем права доступа (только владелец или администратор)
            if (!hasCollectionAccess(collection, userId)) {
                log.warn("User {} has no access to modify collection {}", userId, collectionId);
                return new ChangeDTO<>(State.Fail_Forbidden, "Invalid user", null);
            }

            // Проверяем существование книги
            Optional<Book> bookOpt = bookRepository.findById(bookId);
            if (bookOpt.isEmpty()) {
                log.warn("Book not found with ID: {}", bookId);
                return new ChangeDTO<>(State.Fail_NotFound, "Book not found", null);
            }

            // Проверяем, не добавлена ли уже книга в коллекцию
            boolean alreadyExists = booksBookCollectionsRepository.findByBook_BookIdIn(List.of(bookId))
                    .stream()
                    .anyMatch(bbc -> bbc.getBookCollection().getBcolsId().equals(collectionId));

            if (alreadyExists) {
                log.warn("Book {} already exists in collection {}", bookId, collectionId);
                return new ChangeDTO<>(State.Fail_Conflict, "Book already exists in collection", null);
            }

            // Добавляем книгу в коллекцию
            BooksBookCollections booksBookCollections = BooksBookCollections.builder()
                    .book(bookOpt.get())
                    .bookCollection(collection)
                    .build();

            booksBookCollectionsRepository.save(booksBookCollections);
            log.info("Book {} added to collection {}", bookId, collectionId);

            return new ChangeDTO<>(State.OK, "Book added to collection successfully", null);

        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation when adding book to collection: ", e);
            return handleDataIntegrityViolation(e);
        } catch (Exception e) {
            log.error("Error adding book to collection: ", e);
            return new ChangeDTO<>(State.Fail, "Error adding book to collection: " + e.getMessage(), null);
        }
    }

    @Transactional
    public ChangeDTO<Object> removeBookFromCollection(Integer userId, Integer collectionId, Integer bookId) {
        try {
            log.info("Removing book {} from collection {} by user {}", bookId, collectionId, userId);

            // Получаем коллекцию
            Optional<BookCollection> collectionOpt = bookCollectionRepository.findById(collectionId);
            if (collectionOpt.isEmpty()) {
                log.warn("Collection not found with ID: {}", collectionId);
                return new ChangeDTO<>(State.Fail_NotFound, "Collection not found", null);
            }

            BookCollection collection = collectionOpt.get();

            // Проверяем права доступа (только владелец или администратор)
            if (!hasCollectionAccess(collection, userId)) {
                log.warn("User {} has no access to modify collection {}", userId, collectionId);
                return new ChangeDTO<>(State.Fail_Forbidden, "Invalid user", null);
            }

            // Находим связь книги с коллекцией
            List<BooksBookCollections> booksInCollection = booksBookCollectionsRepository.findByBook_BookIdIn(List.of(bookId));
            Optional<BooksBookCollections> bbcOpt = booksInCollection.stream()
                    .filter(bbc -> bbc.getBookCollection().getBcolsId().equals(collectionId))
                    .findFirst();

            if (bbcOpt.isEmpty()) {
                log.warn("Book {} not found in collection {}", bookId, collectionId);
                return new ChangeDTO<>(State.Fail_NotFound, "Book not found in collection", null);
            }

            // Удаляем связь
            booksBookCollectionsRepository.delete(bbcOpt.get());
            log.info("Book {} removed from collection {}", bookId, collectionId);

            return new ChangeDTO<>(State.OK, "Book removed from collection successfully", null);

        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation when removing book from collection: ", e);
            return handleDataIntegrityViolation(e);
        } catch (Exception e) {
            log.error("Error removing book from collection: ", e);
            return new ChangeDTO<>(State.Fail, "Error removing book from collection: " + e.getMessage(), null);
        }
    }

    @Transactional
    public ChangeDTO<Object> addCollectionPrivilege(Integer userId, Integer collectionId,
                                                    CollectionPrivilegeRequestDTO dto) {
        try {
            log.info("Adding privilege to collection {} by user {} for user {}",
                    collectionId, userId, dto.getUserId());

            // Получаем коллекцию
            Optional<BookCollection> collectionOpt = bookCollectionRepository.findById(collectionId);
            if (collectionOpt.isEmpty()) {
                log.warn("Collection not found with ID: {}", collectionId);
                return new ChangeDTO<>(State.Fail_NotFound, "Collection not found", null);
            }

            BookCollection collection = collectionOpt.get();

            // Проверяем права доступа (только владелец или администратор)
            if (!hasCollectionAccess(collection, userId)) {
                log.warn("User {} has no access to modify privileges for collection {}", userId, collectionId);
                return new ChangeDTO<>(State.Fail_Forbidden, "Invalid user", null);
            }

            // Проверяем существование пользователя, которому даем привилегию
            Optional<User> targetUserOpt = userRepository.findById(dto.getUserId());
            if (targetUserOpt.isEmpty()) {
                log.warn("Target user not found with ID: {}", dto.getUserId());
                return new ChangeDTO<>(State.Fail_NotFound, "Target user not found", null);
            }

            // Проверяем, не является ли целевой пользователь владельцем
            if (collection.getOwner().getUserId().equals(dto.getUserId())) {
                log.warn("Cannot set privilege for collection owner");
                return new ChangeDTO<>(State.Fail_Conflict, "Cannot set privilege for collection owner", null);
            }

            // Валидация статуса
            CvpStatus status;
            try {
                status = CvpStatus.valueOf(dto.getCvpStatus());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid CVP status value: {}", dto.getCvpStatus());
                return new ChangeDTO<>(State.Fail_BadData, "Invalid privilege status value", null);
            }

            // Проверяем, существует ли уже привилегия
            Optional<CollectionViewPrivilege> existingPrivilegeOpt =
                    collectionViewPrivilegeRepository.findByCollectionIdAndUserId(collectionId, dto.getUserId());

            if (existingPrivilegeOpt.isPresent()) {
                // Обновляем существующую привилегию
                CollectionViewPrivilege existingPrivilege = existingPrivilegeOpt.get();
                existingPrivilege.setStatus(status);
                collectionViewPrivilegeRepository.save(existingPrivilege);
                log.info("Updated existing privilege for user {} on collection {}", dto.getUserId(), collectionId);
            } else {
                // Создаем новую привилегию
                CollectionViewPrivilege privilege = CollectionViewPrivilege.builder()
                        .bcolsId(collectionId)
                        .userId(dto.getUserId())
                        .status(status)
                        .collection(collection)
                        .build();
                collectionViewPrivilegeRepository.save(privilege);
                log.info("Created new privilege for user {} on collection {}", dto.getUserId(), collectionId);
            }

            return new ChangeDTO<>(State.OK, "Privilege added successfully", null);

        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation when adding collection privilege: ", e);
            return handleDataIntegrityViolation(e);
        } catch (Exception e) {
            log.error("Error adding collection privilege: ", e);
            return new ChangeDTO<>(State.Fail, "Error adding collection privilege: " + e.getMessage(), null);
        }
    }

    @Transactional
    public ChangeDTO<Object> removeCollectionPrivilege(Integer userId, Integer collectionId, Integer privilegeUserId) {
        try {
            log.info("Removing privilege from collection {} by user {} for user {}",
                    collectionId, userId, privilegeUserId);

            // Получаем коллекцию
            Optional<BookCollection> collectionOpt = bookCollectionRepository.findById(collectionId);
            if (collectionOpt.isEmpty()) {
                log.warn("Collection not found with ID: {}", collectionId);
                return new ChangeDTO<>(State.Fail_NotFound, "Collection not found", null);
            }

            BookCollection collection = collectionOpt.get();

            // Проверяем права доступа (только владелец или администратор)
            if (!hasCollectionAccess(collection, userId)) {
                log.warn("User {} has no access to modify privileges for collection {}", userId, collectionId);
                return new ChangeDTO<>(State.Fail_Forbidden, "Invalid user", null);
            }

            // Проверяем существование привилегии
            Optional<CollectionViewPrivilege> privilegeOpt =
                    collectionViewPrivilegeRepository.findByCollectionIdAndUserId(collectionId, privilegeUserId);

            if (privilegeOpt.isEmpty()) {
                log.warn("Privilege not found for user {} on collection {}", privilegeUserId, collectionId);
                return new ChangeDTO<>(State.Fail_NotFound, "Privilege not found", null);
            }

            // Удаляем привилегию
            collectionViewPrivilegeRepository.delete(privilegeOpt.get());
            log.info("Privilege removed for user {} from collection {}", privilegeUserId, collectionId);

            return new ChangeDTO<>(State.OK, "Privilege removed successfully", null);

        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation when removing collection privilege: ", e);
            return handleDataIntegrityViolation(e);
        } catch (Exception e) {
            log.error("Error removing collection privilege: ", e);
            return new ChangeDTO<>(State.Fail, "Error removing collection privilege: " + e.getMessage(), null);
        }
    }

    @Transactional
    public ChangeDTO<Object> likeCollection(Integer userId, Integer collectionId) {
        try {
            log.info("User {} liking collection {}", userId, collectionId);

            // Проверяем, что userId не null (только зарегистрированные пользователи могут лайкать)
            if (userId == null) {
                log.warn("User ID is null for like operation");
                return new ChangeDTO<>(State.Fail_Forbidden, "Only registered users can like collections", null);
            }

            // Проверяем существование пользователя
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.warn("User not found with ID: {}", userId);
                return new ChangeDTO<>(State.Fail_NotFound, "User not found", null);
            }

            // Проверяем существование коллекции
            Optional<BookCollection> collectionOpt = bookCollectionRepository.findById(collectionId);
            if (collectionOpt.isEmpty()) {
                log.warn("Collection not found with ID: {}", collectionId);
                return new ChangeDTO<>(State.Fail_NotFound, "Collection not found", null);
            }

            // Проверяем доступ к коллекции
            Boolean canView = checkCollectionAccess(collectionId, userId);
            if (Boolean.FALSE.equals(canView)) {
                log.warn("User {} cannot view collection {}, cannot like", userId, collectionId);
                return new ChangeDTO<>(State.Fail_Forbidden, "Cannot like a collection you cannot view", null);
            }

            // Проверяем, не лайкал ли уже пользователь эту коллекцию
            boolean alreadyLiked = likedCollectionRepository.existsByUserIdAndCollectionId(userId, collectionId);
            if (alreadyLiked) {
                log.warn("User {} already liked collection {}", userId, collectionId);
                return new ChangeDTO<>(State.Fail_Conflict, "Collection already liked", null);
            }

            // Создаем лайк
            LikedCollection likedCollection = LikedCollection.builder()
                    .user(userOpt.get())
                    .bcols(collectionOpt.get())
                    .build();

            likedCollectionRepository.save(likedCollection);
            log.info("User {} liked collection {}", userId, collectionId);

            return new ChangeDTO<>(State.OK, "Collection liked successfully", null);

        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation when liking collection: ", e);
            return handleDataIntegrityViolation(e);
        } catch (Exception e) {
            log.error("Error liking collection: ", e);
            return new ChangeDTO<>(State.Fail, "Error liking collection: " + e.getMessage(), null);
        }
    }

    @Transactional
    public ChangeDTO<Object> unlikeCollection(Integer userId, Integer collectionId) {
        try {
            log.info("User {} unliking collection {}", userId, collectionId);

            // Проверяем, что userId не null
            if (userId == null) {
                log.warn("User ID is null for unlike operation");
                return new ChangeDTO<>(State.Fail_Forbidden, "Only registered users can unlike collections", null);
            }

            // Находим лайк
            Optional<LikedCollection> likedCollectionOpt =
                    likedCollectionRepository.findByUserIdAndCollectionId(userId, collectionId);

            if (likedCollectionOpt.isEmpty()) {
                log.warn("Like not found for user {} on collection {}", userId, collectionId);
                return new ChangeDTO<>(State.Fail_NotFound, "Like not found", null);
            }

            // Удаляем лайк
            likedCollectionRepository.delete(likedCollectionOpt.get());
            log.info("User {} unliked collection {}", userId, collectionId);

            return new ChangeDTO<>(State.OK, "Collection unliked successfully", null);

        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation when unliking collection: ", e);
            return handleDataIntegrityViolation(e);
        } catch (Exception e) {
            log.error("Error unliking collection: ", e);
            return new ChangeDTO<>(State.Fail, "Error unliking collection: " + e.getMessage(), null);
        }
    }

    @Transactional(readOnly = true)
    public ChangeDTO<Object> getMyCollections(Integer userId, Integer page, Integer batch) {
        try {
            log.debug("Getting collections for user ID: {}, page: {}, batch: {}", userId, page, batch);

            // Проверяем, что userId не null (только зарегистрированные пользователи имеют коллекции)
            if (userId == null) {
                log.warn("User ID is null for getting collections");
                return new ChangeDTO<>(State.Fail_Forbidden,
                        "Only registered users can view their collections", null);
            }

            // Проверяем существование пользователя
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.warn("User not found with ID: {}", userId);
                return new ChangeDTO<>(State.Fail_NotFound, "User not found", null);
            }

            if (page == null || page < 0) {
                page = 0;
            }
            if (batch == null || batch <= 0) {
                batch = 10;
            }

            Pageable pageable = PageRequest.of(page, batch);

            // Получаем коллекции пользователя
            Page<BookCollection> collectionsPage = bookCollectionRepository.findByOwner_UserId(userId, pageable);

            if (collectionsPage.isEmpty()) {
                log.debug("No collections found for user {}", userId);

                Map<String, Object> emptyResponse = new HashMap<>();
                emptyResponse.put("page", page);
                emptyResponse.put("batch", batch);
                emptyResponse.put("totalPages", collectionsPage.getTotalPages());
                emptyResponse.put("totalElements", collectionsPage.getTotalElements());
                emptyResponse.put("collections", new ArrayList<>());

                return new ChangeDTO<>(State.OK, "No collections found", emptyResponse);
            }

            List<BookCollection> collections = collectionsPage.getContent();
            List<Integer> collectionIds = collections.stream()
                    .map(BookCollection::getBcolsId)
                    .collect(Collectors.toList());

            // Получаем количество книг в каждой коллекции
            List<Object[]> bookCountsResults = booksBookCollectionsRepository
                    .findBookCountsByCollectionIds(collectionIds);
            Map<Integer, Long> booksCountMap = bookCountsResults.stream()
                    .collect(Collectors.toMap(
                            row -> (Integer) row[0],
                            row -> (Long) row[1]
                    ));

            // Получаем количество лайков для каждой коллекции
            List<Object[]> likesResults = likedCollectionRepository.findPopularCollections();
            Map<Integer, Long> likesCountMap = likesResults.stream()
                    .collect(Collectors.toMap(
                            row -> (Integer) row[0],
                            row -> (Long) row[1]
                    ));

            // Получаем ID всех photoLink
            List<Integer> photoLinkIds = collections.stream()
                    .map(BookCollection::getPhotoLink)
                    .filter(Objects::nonNull)
                    .map(ImageLink::getImglId)
                    .collect(Collectors.toList());

            // Получаем все ImageLink с ImageData
            Map<Integer, ImageLink> imageLinksMap;
            if (!photoLinkIds.isEmpty()) {
                List<ImageLink> imageLinks = imageLinkRepository.findByIdsWithImageData(photoLinkIds);
                imageLinksMap = imageLinks.stream()
                        .collect(Collectors.toMap(ImageLink::getImglId, il -> il));
            } else {
                imageLinksMap = new HashMap<>();
            }

            // Преобразуем в DTO
            List<CollectionSimpleDTO> collectionDTOs = collections.stream()
                    .map(collection -> {
                        CollectionSimpleDTO dto = new CollectionSimpleDTO();
                        dto.setCollectionId(collection.getBcolsId());
                        dto.setTitle(collection.getTitle());
                        dto.setDescription(collection.getDescription());
                        dto.setConfidentiality(String.valueOf(collection.getConfidentiality()));
                        dto.setCollectionType(String.valueOf(collection.getCollectionType()));

                        // Устанавливаем количество книг
                        Long booksCount = booksCountMap.getOrDefault(collection.getBcolsId(), 0L);
                        dto.setBooksCount(booksCount);

                        // Устанавливаем количество лайков
                        Long likesCount = likesCountMap.getOrDefault(collection.getBcolsId(), 0L);
                        dto.setLikesCount(likesCount);

                        // Устанавливаем фото, если есть
                        ImageLink photoLink = collection.getPhotoLink();
                        if (photoLink != null) {
                            ImageLink fullImageLink = imageLinksMap.get(photoLink.getImglId());
                            if (fullImageLink != null && fullImageLink.getImageData() != null) {
                                ImageData imageData = fullImageLink.getImageData();
                                ImageDataDTO imageDataDTO = new ImageDataDTO(
                                        imageData.getImgdId(),
                                        imageData.getUuid(),
                                        imageData.getSize(),
                                        imageData.getMimeType(),
                                        imageData.getExtension()
                                );
                                ImageLinkDTO imageLinkDTO = new ImageLinkDTO(
                                        fullImageLink.getImglId(),
                                        imageDataDTO
                                );
                                dto.setPhotoLink(imageLinkDTO);
                            }
                        }

                        return dto;
                    })
                    .collect(Collectors.toList());

            // Сортируем по ID для сохранения порядка пагинации
            Map<Integer, CollectionSimpleDTO> collectionMap = collectionDTOs.stream()
                    .collect(Collectors.toMap(CollectionSimpleDTO::getCollectionId, dto -> dto));

            List<CollectionSimpleDTO> sortedCollectionDTOs = collectionIds.stream()
                    .map(collectionMap::get)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            // Подготавливаем ответ
            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("page", page);
            response.put("batch", batch);
            response.put("totalPages", collectionsPage.getTotalPages());
            response.put("totalElements", collectionsPage.getTotalElements());
            response.put("collections", sortedCollectionDTOs);

            log.debug("Retrieved {} collections for user {}", sortedCollectionDTOs.size(), userId);
            return new ChangeDTO<>(State.OK, "Collections retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error retrieving collections for user {}: ", userId, e);
            return new ChangeDTO<>(State.Fail,
                    "Error retrieving collections: " + e.getMessage(), null);
        }
    }

    @Transactional(readOnly = true)
    public ChangeDTO<Object> checkBookInCollection(Integer userId, Integer collectionId, Integer bookId) {
        try {
            log.debug("Checking if book {} exists in collection {} for user {}", bookId, collectionId, userId);

            // Проверяем доступ к коллекции
            Boolean canView = checkCollectionAccess(collectionId, userId);
            if (Boolean.FALSE.equals(canView)) {
                log.warn("Access denied to collection {} for user {}", collectionId, userId);
                return new ChangeDTO<>(State.Fail_Forbidden, "Access to collection denied", null);
            }

            // Проверяем существование коллекции
            Optional<BookCollection> collectionOpt = bookCollectionRepository.findById(collectionId);
            if (collectionOpt.isEmpty()) {
                log.warn("Collection not found with ID: {}", collectionId);
                return new ChangeDTO<>(State.Fail_NotFound, "Collection not found", null);
            }

            // Проверяем существование книги
            Optional<Book> bookOpt = bookRepository.findById(bookId);
            if (bookOpt.isEmpty()) {
                log.warn("Book not found with ID: {}", bookId);
                return new ChangeDTO<>(State.Fail_NotFound, "Book not found", null);
            }

            // Проверяем, есть ли книга в коллекции
            List<BooksBookCollections> booksInCollection = booksBookCollectionsRepository
                    .findByBook_BookIdIn(List.of(bookId));

            boolean exists = booksInCollection.stream()
                    .anyMatch(bbc -> bbc.getBookCollection().getBcolsId().equals(collectionId));

            // Создаем подробный ответ
            Map<String, Object> response = new HashMap<>();
            response.put("collectionId", collectionId);
            response.put("bookId", bookId);
            response.put("exists", exists);

            // Если книга есть в коллекции, добавляем дополнительную информацию
            if (exists) {
                Optional<BooksBookCollections> bbcOpt = booksInCollection.stream()
                        .filter(bbc -> bbc.getBookCollection().getBcolsId().equals(collectionId))
                        .findFirst();

                if (bbcOpt.isPresent()) {
                    BooksBookCollections bbc = bbcOpt.get();
                    response.put("bookCollectionId", bbc.getCBookBcolId()); // ID связи
                }

                // Добавляем информацию о книге
                Book book = bookOpt.get();
                Map<String, Object> bookInfo = new HashMap<>();
                bookInfo.put("title", book.getTitle());
                bookInfo.put("subtitle", book.getSubtitle());
                bookInfo.put("isbn", book.getIsbn());
                response.put("bookInfo", bookInfo);

                // Добавляем информацию о коллекции
                BookCollection collection = collectionOpt.get();
                Map<String, Object> collectionInfo = new HashMap<>();
                collectionInfo.put("title", collection.getTitle());
                collectionInfo.put("confidentiality", collection.getConfidentiality());
                collectionInfo.put("collectionType", collection.getCollectionType());
                response.put("collectionInfo", collectionInfo);
            }

            log.debug("Book {} exists in collection {}: {}", bookId, collectionId, exists);
            return new ChangeDTO<>(State.OK,
                    exists ? "Book exists in collection" : "Book does not exist in collection",
                    response);

        } catch (Exception e) {
            log.error("Error checking if book exists in collection: ", e);
            return new ChangeDTO<>(State.Fail,
                    "Error checking if book exists in collection: " + e.getMessage(), null);
        }
    }

    // Вспомогательные методы

    private boolean hasCollectionAccess(BookCollection collection, Integer userId) {
        // Если userId == null, это администратор - разрешаем все
        if (userId == null) {
            return true;
        }
        // Проверяем, что пользователь является владельцем коллекции
        return collection.getOwner() != null &&
                collection.getOwner().getUserId().equals(userId);
    }

    private Boolean checkCollectionAccess(Integer collectionId, Integer userId) {
        try {
            // Если userId не указан, проверяем только публичные коллекции
            if (userId == null) {
                Optional<BookCollection> collectionOpt = bookCollectionRepository.findById(collectionId);
                return collectionOpt.isPresent() &&
                        collectionOpt.get().getConfidentiality() == Confidentiality.Public;
            }

            // Если userId указан, используем функцию CAN_VIEW_COLLECTION
            return collectionAccessRepository.canViewCollection(userId, collectionId);
        } catch (Exception e) {
            log.error("Error checking collection access: ", e);
            return false;
        }
    }

    private ChangeDTO<Object> handleDataIntegrityViolation(DataIntegrityViolationException e) {
        String message = e.getMostSpecificCause().getMessage();

        if (message.contains("added_by")) {
            return new ChangeDTO<>(State.Fail_BadData,
                    "User with specified ID does not exist", null);
        } else if (message.contains("photo_link")) {
            return new ChangeDTO<>(State.Fail_BadData,
                    "Image with specified photo link does not exist", null);
        } else if (message.contains("unique constraint") && message.contains("books_title_subtitle_key")) {
            return new ChangeDTO<>(State.Fail_Conflict,
                    "A book with this title and subtitle combination already exists", null);
        } else if (message.contains("unique constraint") && message.contains("books_isbn_key")) {
            return new ChangeDTO<>(State.Fail_Conflict,
                    "Book with this ISBN already exists", null);
        } else if (message.contains("unique constraint") && message.contains("books_photo_link_key")) {
            return new ChangeDTO<>(State.Fail_Conflict,
                    "Book with this photo link already exists", null);
        } else if (message.contains("unique constraint") && message.contains("book_reviews_user_id_book_id_key")) {
            return new ChangeDTO<>(State.Fail_Conflict,
                    "You have already reviewed this book", null);
        } else if (message.contains("unique constraint") && message.contains("liked_collections_user_id_bcols_id_key")) {
            return new ChangeDTO<>(State.Fail_Conflict,
                    "You have already liked this collection", null);
        } else if (message.contains("unique constraint") && message.contains("books_book_collections_book_id_bcols_id_key")) {
            return new ChangeDTO<>(State.Fail_Conflict,
                    "Book already exists in collection", null);
        } else {
            return new ChangeDTO<>(State.Fail_Conflict,
                    "Data integrity violation: " + message, null);
        }
    }

    private Page<BooksBookCollections> getBooksInCollectionPage(Integer collectionId, Pageable pageable) {
        return booksBookCollectionsRepository.findByBookCollection_BcolsId(collectionId, pageable);
    }
}